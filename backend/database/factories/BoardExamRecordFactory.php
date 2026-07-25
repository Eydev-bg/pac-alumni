<?php

namespace Database\Factories;

use App\Enums\BoardStatus;
use App\Models\BoardExamRecord;
use App\Models\Graduate;
use Illuminate\Database\Eloquent\Factories\Factory;

class BoardExamRecordFactory extends Factory
{
    protected $model = BoardExamRecord::class;

    public function definition(): array
    {
        return [
            'graduate_id' => Graduate::factory(),
            'exam_name' => 'Licensure Exam',
            'exam_year' => fake()->numberBetween(2020, 2026),
            'status' => BoardStatus::PASSED,
            'is_current' => true,
            'proof_file' => null,
            'updated_by_alumni' => false,
            'verified_by' => null,
            'verified_at' => null,
        ];
    }

    public function passed(): static
    {
        return $this->state(fn () => ['status' => BoardStatus::PASSED]);
    }

    public function notApplicable(): static
    {
        return $this->state(fn () => ['status' => BoardStatus::NOT_APPLICABLE]);
    }
}
