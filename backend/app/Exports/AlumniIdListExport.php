<?php
// ═══════════════════════════════════════════════════════════
//  FILE: backend/app/Exports/AlumniIdListExport.php
//  Uses maatwebsite/excel (already in composer.json)
//  Streams from query to avoid loading all records into memory.
// ═══════════════════════════════════════════════════════════

namespace App\Exports;

use App\Models\Graduate;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class AlumniIdListExport implements FromQuery, WithHeadings, WithMapping, ShouldAutoSize, WithStyles
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
        return Graduate::query()
            ->collegeOnly()
            ->whereNotNull('alumni_id_number')
            ->with('course.department')
            ->byDepartment($this->departmentId)
            ->byCourse($this->courseId)
            ->byYear($this->batchYear)
            ->orderBy('alumni_id_number');
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
        ];
    }

    /**
     * Map each row from the query result.
     */
    public function map($row): array
    {
        return [
            $row->alumni_id_number,
            trim($row->full_name),
            $row->course_code ?? '',
            $row->department_name ?? '',
            $row->graduation_year,
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
