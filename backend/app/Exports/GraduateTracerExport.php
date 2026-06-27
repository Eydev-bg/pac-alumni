<?php
// ═══════════════════════════════════════════════════════════
//  FILE: backend/app/Exports/GraduateTracerExport.php
//  Uses maatwebsite/excel (already in composer.json)
//  Streams from query to avoid loading all records into memory.
// ═══════════════════════════════════════════════════════════

namespace App\Exports;

use App\Services\Admin\GraduateTracerService;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class GraduateTracerExport implements FromQuery, WithHeadings, WithMapping, ShouldAutoSize, WithStyles
{
    use Exportable;

    public function __construct(
        protected ?int $courseId = null,
        protected ?int $batchYear = null,
        protected ?string $employmentStatus = null,
        protected ?int $departmentId = null,
    ) {}

    /**
     * Return a query builder — maatwebsite/excel chunks it automatically.
     */
    public function query()
    {
        $service = app(GraduateTracerService::class);

        return $service->getTracerExportQuery(
            $this->courseId,
            $this->batchYear,
            $this->employmentStatus,
            $this->departmentId,
        );
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
            'Batch Year',
            'Registered',
            'Employment Status',
            'Current Company',
            'Current Job Title',
            'Industry',
            'Employment Type',
            'Board Status',
        ];
    }

    /**
     * Map each row from the query result.
     */
    public function map($row): array
    {
        return [
            $row->alumni_id_number ?? 'N/A',
            trim($row->full_name),
            $row->course,
            $row->department,
            $row->batch_year,
            $row->registered,
            ucfirst(str_replace('_', ' ', $row->employment_status)),
            $row->current_company ?? '',
            $row->current_job_title ?? '',
            $row->industry ?? '',
            $row->employment_type ? ucfirst(str_replace('_', ' ', $row->employment_type)) : '',
            ucfirst(str_replace('_', ' ', $row->board_status)),
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
