<?php

namespace App\Services\Admin;

use App\Enums\EducationLevel;
use App\Enums\ImportStatus;
use App\Models\Course;
use App\Models\Graduate;
use App\Models\ImportBatch;
use App\Repositories\Contracts\GraduateRepositoryInterface;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

class GraduateImportService
{
    public function __construct(
        protected GraduateRepositoryInterface $graduateRepo,
    ) {}

    public function import(UploadedFile $file, string $educationLevel, int $uploadedBy): ImportBatch
    {
        $batch = ImportBatch::create([
            'uploaded_by' => $uploadedBy,
            'file_name' => $file->getClientOriginalName(),
            'education_level' => $educationLevel,
            'status' => ImportStatus::PROCESSING,
        ]);

        try {
            $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($file->getPathname());
            $sheet = $spreadsheet->getActiveSheet();
            $rows = $sheet->toArray(null, true, true, true);

            if (count($rows) < 2) {
                $batch->update([
                    'status' => ImportStatus::FAILED,
                    'error_details' => ['File is empty or has no data rows.'],
                    'completed_at' => now(),
                ]);
                return $batch;
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
                return $batch;
            }

            $errors = [];
            $importedCount = 0;
            $duplicateCount = 0;
            $errorCount = 0;

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
                    $existingById = Graduate::where('alumni_id_number', $providedId)->first();
                    if ($existingById) {
                        $errors[] = "Row {$rowNum}: Alumni ID '{$providedId}' is already used by another graduate record.";
                        $errorCount++;
                        continue;
                    }
                    $alumniIdNumber = $providedId;
                } else if ($educationLevel === 'college') {
                    $alumniIdNumber = Graduate::generateAlumniId((int) $parsed['graduation_year']);
                }

                // ─── Duplicate check by name + year + level ─
                $existingByName = Graduate::where('first_name', trim($parsed['first_name']))
                    ->where('last_name', trim($parsed['last_name']))
                    ->where('graduation_year', (int) $parsed['graduation_year'])
                    ->where('education_level', $educationLevel)
                    ->first();

                if ($existingByName) {
                    $duplicateCount++;
                    continue;
                }

                // ─── Resolve course and department ──────────
                $courseId = null;
                $departmentId = null;

                if ($educationLevel === 'college' && !empty($parsed['course_code'])) {
                    $code = strtoupper(trim($parsed['course_code']));

                    $course = Course::where('code', $code)->first();

                    if ($course) {
                        $courseId = $course->id;
                        $departmentId = $course->department_id;
                    } else {
                        $dept = \App\Models\Department::where('code', $code)->first();
                        if ($dept) {
                            $course = $dept->courses()->first();
                            if ($course) {
                                $courseId = $course->id;
                                $departmentId = $dept->id;
                            } else {
                                $departmentId = $dept->id;
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
                    $dept = \App\Models\Department::where('education_level', $educationLevel)
                        ->where('status', 'active')
                        ->first();
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
        } catch (\Exception $e) {
            DB::rollBack();
            $batch->update([
                'status' => ImportStatus::FAILED,
                'error_details' => [$e->getMessage()],
                'completed_at' => now(),
            ]);
        }

        return $batch->fresh();
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
