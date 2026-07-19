<?php
// ═══════════════════════════════════════════════════════════
//  FILE: backend/app/Exports/BoardPassingExport.php
//  Uses maatwebsite/excel (already in composer.json)
//  Streams from query to avoid loading all records into memory.
// ═══════════════════════════════════════════════════════════

namespace App\Exports;

use App\Enums\BoardStatus;
use App\Models\BoardExamRecord;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class BoardPassingExport implements FromQuery, WithHeadings, WithMapping, ShouldAutoSize, WithStyles
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
        return BoardExamRecord::query()
            ->where('status', BoardStatus::PASSED)
            ->with(['graduate.course.department'])
            ->whereHas('graduate', fn ($q) => $q
                ->byDepartment($this->departmentId)
                ->byCourse($this->courseId)
                ->byYear($this->batchYear))
            ->orderBy('exam_year', 'desc');
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
            'Exam Name',
            'Exam Year',
            'Batch Year',
        ];
    }

    /**
     * Map each row from the query result.
     */
    public function map($row): array
    {
        return [
            $row->graduate?->alumni_id_number ?? 'N/A',
            $row->graduate ? trim($row->graduate->full_name) : '',
            $row->graduate?->course_code ?? '',
            $row->graduate?->department_name ?? '',
            $row->exam_name,
            $row->exam_year,
            $row->graduate?->graduation_year,
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
