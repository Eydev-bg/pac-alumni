<?php
// ═══════════════════════════════════════════════════════════
//  FILE: backend/app/Exports/EmploymentExport.php
//  Uses maatwebsite/excel (already in composer.json)
//  Streams from query to avoid loading all records into memory.
// ═══════════════════════════════════════════════════════════

namespace App\Exports;

use App\Models\AlumniProfile;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class EmploymentExport implements FromQuery, WithHeadings, WithMapping, ShouldAutoSize, WithStyles
{
    use Exportable;

    public function __construct(
        protected ?int $departmentId = null,
        protected ?int $courseId = null,
        protected ?int $batchYear = null,
    ) {}

    /**
     * Return a query builder — maatwebsite/excel chunks it automatically.
     */
    public function query()
    {
        return AlumniProfile::query()
            ->with([
                'graduate.course.department',
                // Current/most-recent employment record first (current flag wins,
                // then latest by created_at). Eager-loaded to avoid N+1.
                'graduate.employmentRecords' => fn ($q) => $q
                    ->orderByDesc('is_current')
                    ->orderByDesc('created_at'),
            ])
            ->whereHas('graduate', fn ($q) => $q
                ->collegeOnly()
                ->byDepartment($this->departmentId)
                ->byCourse($this->courseId)
                ->byYear($this->batchYear));
    }

    /**
     * Column headers for the first row.
     */
    public function headings(): array
    {
        return [
            'Alumni ID',
            'Full Name',
            'Course',
            'Department',
            'Graduation Year',
            'Employment Status',
            'Employment Type',
        ];
    }

    /**
     * Map each row from the query result.
     */
    public function map($row): array
    {
        // Current/most-recent employment record (already ordered in query()).
        // Null for alumni with no employment record (Unemployed/Unknown).
        $currentEmployment = $row->graduate?->employmentRecords->first();

        return [
            $row->graduate?->alumni_id_number ?? 'N/A',
            $row->graduate ? trim($row->graduate->full_name) : '',
            $row->graduate?->course_code ?? '',
            $row->graduate?->department_name ?? '',
            $row->graduate?->graduation_year,
            $row->employment_status?->value,
            $currentEmployment?->employment_type?->label() ?? '',
        ];
    }

    /**
     * Style the header row.
     */
    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => [
                    'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '0F172A'], // Navy header
                ],
            ],
        ];
    }
}
