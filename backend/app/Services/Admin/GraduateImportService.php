<?php

namespace App\Services\Admin;

use App\Enums\DepartmentStatus;
use App\Enums\EducationLevel;
use App\Enums\ImportStatus;
use App\Jobs\ProcessGraduateImport;
use App\Models\Course;
use App\Models\Department;
use App\Models\Graduate;
use App\Models\ImportBatch;
use App\Repositories\Contracts\GraduateRepositoryInterface;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class GraduateImportService
{
    /** Sub-directory (on the default filesystem disk) for queued import files. */
    private const STORAGE_DIR = 'imports';

    public function __construct(
        protected GraduateRepositoryInterface $graduateRepo,
        protected DashboardCacheService $dashboardCache,
    ) {}

    /**
     * Queue a graduate import.
     *
     * Persists the uploaded file to storage, creates the ImportBatch in a
     * PROCESSING state, and dispatches the processing job — returning the batch
     * handle immediately so the HTTP request never blocks on row processing.
     */
    public function queue(UploadedFile $file, string $educationLevel, int $uploadedBy): ImportBatch
    {
        // Capture the original name before store() moves the temp file.
        $originalName = $file->getClientOriginalName();
        $storedPath = $file->store(self::STORAGE_DIR);

        $batch = ImportBatch::create([
            'uploaded_by' => $uploadedBy,
            'file_name' => $originalName,
            'education_level' => $educationLevel,
            'status' => ImportStatus::PROCESSING,
        ]);

        ProcessGraduateImport::dispatch($batch->id, $storedPath);

        return $batch;
    }

    /**
     * Process a previously-stored import file into an existing batch.
     *
     * Runs on the queue. Reads the education level from the batch, performs the
     * validated + N+1-free row import, and always deletes the stored file when
     * finished (success or failure).
     */
    public function process(ImportBatch $batch, string $storedPath): void
    {
        $educationLevel = $batch->education_level->value;

        try {
            $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load(Storage::path($storedPath));
            $sheet = $spreadsheet->getActiveSheet();
            $rows = $sheet->toArray(null, true, true, true);

            if (count($rows) < 2) {
                $batch->update([
                    'status' => ImportStatus::FAILED,
                    'error_details' => ['File is empty or has no data rows.'],
                    'completed_at' => now(),
                ]);
                return;
            }

            $headers = array_map(fn($h) => strtolower(trim($h ?? '')), array_values($rows[1]));
            unset($rows[1]);

            $batch->update(['total_records' => count($rows)]);

            $headerMap = $this->mapHeaders($headers);

            if (!$headerMap) {
                $batch->update([
                    'status' => ImportStatus::FAILED,
                    'error_details' => ['Invalid headers. Required: first_name, last_name, graduation_year. For college: course_code is also required.'],
                    'completed_at' => now(),
                ]);
                return;
            }

            $errors = [];
            $importedCount = 0;
            $duplicateCount = 0;
            $errorCount = 0;

            // ─── Preload reference data once (kills per-row N+1) ─
            // Course/department resolution below reads from these keyed
            // collections instead of querying the database on every row.
            $reference = $this->preloadReferenceData();

            // ─── Preload duplicate-detection keys once ──────────
            // Existing alumni-id and name+year keys are loaded up front (scoped
            // to the values present in this file) and then kept in memory. The
            // sets are updated as rows are inserted so intra-file duplicates are
            // still detected — matching the previous per-row query behaviour.
            $duplicateKeys = $this->preloadDuplicateKeys($rows, $headerMap, $educationLevel);
            $existingAlumniIds = $duplicateKeys['alumniIds'];
            $existingNameKeys = $duplicateKeys['nameKeys'];

            DB::beginTransaction();

            foreach ($rows as $rowNum => $row) {
                $rowData = array_values($row);
                $parsed = $this->parseRow($rowData, $headerMap);

                $validation = $this->validateRow($parsed, $educationLevel, $rowNum);
                if ($validation !== true) {
                    $errors[] = $validation;
                    $errorCount++;
                    continue;
                }

                // ─── Alumni ID Logic ────────────────────────
                // If Excel has alumni_id filled → use it (old graduates with existing IDs).
                // If empty → auto-generate (new graduates), college only.
                $alumniIdNumber = null;

                if (!empty($parsed['alumni_id'])) {
                    $providedId = trim($parsed['alumni_id']);

                    // Reject duplicate alumni_id — must be unique system-wide.
                    if (isset($existingAlumniIds[$this->alumniIdKey($providedId)])) {
                        $errors[] = "Row {$rowNum}: Alumni ID '{$providedId}' is already used by another graduate record.";
                        $errorCount++;
                        continue;
                    }
                    $alumniIdNumber = $providedId;
                } else if ($educationLevel === 'college') {
                    $alumniIdNumber = Graduate::generateAlumniId((int) $parsed['graduation_year']);
                }

                // ─── Duplicate check by name + year + level ─
                $nameKey = $this->nameKey($parsed['first_name'], $parsed['last_name'], (int) $parsed['graduation_year']);

                if (isset($existingNameKeys[$nameKey])) {
                    $duplicateCount++;
                    continue;
                }

                // ─── Resolve course and department ──────────
                $courseId = null;
                $departmentId = null;

                if ($educationLevel === 'college' && !empty($parsed['course_code'])) {
                    $code = strtoupper(trim($parsed['course_code']));

                    $course = $reference['coursesByCode']->get($code);

                    if ($course) {
                        $courseId = $course->id;
                        $departmentId = $course->department_id;
                    } else {
                        $dept = $reference['departmentsByCode']->get($code);
                        if ($dept) {
                            $course = $reference['firstCourseByDept']->get($dept->id);
                            if ($course) {
                                $courseId = $course->id;
                                $departmentId = $dept->id;
                            } else {
                                // College graduate, but the resolved department has
                                // no course to attach to. Reject the row instead of
                                // inserting a course_id=null record that would later
                                // disappear from the tracer export (inner-joins courses).
                                $errors[] = "Row {$rowNum}: Department '{$code}' has no course to link this college graduate to. Please add a course under it in Courses management.";
                                $errorCount++;
                                continue;
                            }
                        } else {
                            $errors[] = "Row {$rowNum}: Course/Department code '{$code}' not found. Please add it first in Courses management.";
                            $errorCount++;
                            continue;
                        }
                    }
                }

                // For non-college, resolve department by education_level
                if ($educationLevel !== 'college' && !$departmentId) {
                    $dept = $reference['activeDeptByLevel']->get($educationLevel);
                    if ($dept) {
                        $departmentId = $dept->id;
                    }
                }

                $this->graduateRepo->create([
                    'first_name' => trim($parsed['first_name']),
                    'middle_name' => !empty($parsed['middle_name']) ? trim($parsed['middle_name']) : null,
                    'last_name' => trim($parsed['last_name']),
                    'suffix' => !empty($parsed['suffix']) ? trim($parsed['suffix']) : null,
                    'education_level' => $educationLevel,
                    'graduation_year' => (int) $parsed['graduation_year'],
                    'department_id' => $departmentId,
                    'course_id' => $courseId,
                    'alumni_id_number' => $alumniIdNumber,
                ]);

                $importedCount++;

                // Track keys inserted during this run so later rows in the same
                // file are detected as duplicates (mirrors the old per-row query,
                // which saw earlier inserts inside the open transaction).
                if ($alumniIdNumber !== null) {
                    $existingAlumniIds[$this->alumniIdKey($alumniIdNumber)] = true;
                }
                $existingNameKeys[$nameKey] = true;
            }

            DB::commit();

            $batch->update([
                'imported_count' => $importedCount,
                'duplicate_count' => $duplicateCount,
                'error_count' => $errorCount,
                'error_details' => !empty($errors) ? $errors : null,
                'status' => ImportStatus::COMPLETED,
                'completed_at' => now(),
            ]);

            // Freshly imported graduates change dashboard aggregates.
            $this->dashboardCache->flush();
        } catch (\Throwable $e) {
            if (DB::transactionLevel() > 0) {
                DB::rollBack();
            }
            $batch->update([
                'status' => ImportStatus::FAILED,
                'error_details' => [$e->getMessage()],
                'completed_at' => now(),
            ]);
        } finally {
            // Remove the queued file regardless of outcome.
            Storage::delete($storedPath);
        }
    }

    /**
     * Preload course/department reference data into keyed collections so the
     * row loop resolves lookups from memory instead of issuing per-row queries.
     * Reference tables are small, so this is a constant number of queries
     * regardless of how many rows the import file contains.
     *
     * Keys mirror the original per-row query semantics:
     *  - codes are upper-cased/trimmed (matches the row-side lookup key)
     *  - `->map->first()` keeps the first match per key (matches `->first()`)
     *  - only active departments feed the education-level fallback map
     *
     * @return array{
     *   coursesByCode: Collection,
     *   firstCourseByDept: Collection,
     *   departmentsByCode: Collection,
     *   activeDeptByLevel: Collection
     * }
     */
    private function preloadReferenceData(): array
    {
        $courses = Course::get(['id', 'code', 'department_id']);
        $departments = Department::get(['id', 'code', 'education_level', 'status']);

        return [
            'coursesByCode' => $courses
                ->groupBy(fn (Course $c) => strtoupper(trim((string) $c->code)))
                ->map->first(),
            'firstCourseByDept' => $courses
                ->groupBy('department_id')
                ->map->first(),
            'departmentsByCode' => $departments
                ->groupBy(fn (Department $d) => strtoupper(trim((string) $d->code)))
                ->map->first(),
            'activeDeptByLevel' => $departments
                ->filter(fn (Department $d) => $d->status === DepartmentStatus::ACTIVE)
                ->groupBy('education_level')
                ->map->first(),
        ];
    }

    /**
     * Preload duplicate-detection lookups once, scoped to the values present in
     * the file, so the row loop checks duplicates against in-memory sets instead
     * of issuing a query per row. Returns sets (keyed by a normalised key with a
     * `true` value) for O(1) `isset()` lookups.
     *
     * @return array{alumniIds: array<string,bool>, nameKeys: array<string,bool>}
     */
    private function preloadDuplicateKeys(array $rows, array $headerMap, string $educationLevel): array
    {
        $providedIds = [];
        $years = [];

        foreach ($rows as $row) {
            $parsed = $this->parseRow(array_values($row), $headerMap);

            if (!empty($parsed['alumni_id'])) {
                $providedIds[] = trim($parsed['alumni_id']);
            }
            if (!empty($parsed['graduation_year']) && is_numeric($parsed['graduation_year'])) {
                $years[] = (int) $parsed['graduation_year'];
            }
        }

        $providedIds = array_values(array_unique($providedIds));
        $years = array_values(array_unique($years));

        // Alumni-id uniqueness is system-wide, so match any existing graduate
        // carrying one of the file's ids (case-insensitive, mirroring the DB).
        $alumniIds = empty($providedIds)
            ? []
            : Graduate::whereIn('alumni_id_number', $providedIds)
                ->pluck('alumni_id_number')
                ->mapWithKeys(fn ($id) => [$this->alumniIdKey($id) => true])
                ->all();

        // Name+year duplicate check is scoped to the education level (as before)
        // and narrowed to the years present in the file.
        $nameKeys = empty($years)
            ? []
            : Graduate::where('education_level', $educationLevel)
                ->whereIn('graduation_year', $years)
                ->get(['first_name', 'last_name', 'graduation_year'])
                ->mapWithKeys(fn (Graduate $g) => [
                    $this->nameKey($g->first_name, $g->last_name, (int) $g->graduation_year) => true,
                ])
                ->all();

        return ['alumniIds' => $alumniIds, 'nameKeys' => $nameKeys];
    }

    /**
     * Normalised key for alumni-id comparison (case-insensitive, trimmed) so the
     * in-memory set matches MySQL's case-insensitive column collation.
     */
    private function alumniIdKey(?string $id): string
    {
        return strtoupper(trim((string) $id));
    }

    /**
     * Normalised key for name+year duplicate comparison (case-insensitive,
     * trimmed) — mirrors the previous `where(first)->where(last)->where(year)`.
     */
    private function nameKey(?string $first, ?string $last, int $year): string
    {
        return strtolower(trim((string) $first)) . '|' . strtolower(trim((string) $last)) . '|' . $year;
    }

    private function mapHeaders(array $headers): ?array
    {
        $map = [];
        $aliases = [
            'first_name' => ['first_name', 'first name', 'firstname', 'fname', 'given name'],
            'middle_name' => ['middle_name', 'middle name', 'middlename', 'mname', 'mi'],
            'last_name' => ['last_name', 'last name', 'lastname', 'lname', 'surname', 'family name'],
            'suffix' => ['suffix', 'sfx', 'name suffix'],
            'graduation_year' => ['graduation_year', 'graduation year', 'grad_year', 'grad year', 'year', 'year_graduated', 'year graduated'],
            'alumni_id' => ['alumni_id', 'alumni id', 'alumni_id_number', 'alumni id number', 'alum_id', 'alum id'],
            'course_code' => ['course_code', 'course code', 'course', 'program', 'program_code', 'department_code', 'department code', 'dept_code', 'dept code', 'department', 'dept'],
        ];

        foreach ($aliases as $field => $possibleNames) {
            foreach ($possibleNames as $name) {
                $index = array_search($name, $headers);
                if ($index !== false) {
                    $map[$field] = $index;
                    break;
                }
            }
        }

        // Required: first_name, last_name, graduation_year
        $required = ['first_name', 'last_name', 'graduation_year'];
        foreach ($required as $req) {
            if (!isset($map[$req])) return null;
        }

        return $map;
    }

    private function parseRow(array $row, array $headerMap): array
    {
        $parsed = [];
        foreach ($headerMap as $field => $index) {
            $parsed[$field] = $row[$index] ?? null;
        }
        return $parsed;
    }

    private function validateRow(array $data, string $educationLevel, int $rowNum): string|true
    {
        if (empty($data['first_name'])) return "Row {$rowNum}: First name is required.";
        if (empty($data['last_name'])) return "Row {$rowNum}: Last name is required.";
        if (empty($data['graduation_year']) || !is_numeric($data['graduation_year'])) return "Row {$rowNum}: Valid graduation year is required.";
        if ($educationLevel === 'college' && empty($data['course_code'])) return "Row {$rowNum}: Course code is required for college graduates.";
        return true;
    }

    public function checkDuplicates(array $alumniIds): array
    {
        return Graduate::whereIn('alumni_id_number', $alumniIds)
            ->pluck('alumni_id_number')
            ->toArray();
    }
}
