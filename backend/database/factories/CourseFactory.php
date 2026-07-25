<?php

namespace Database\Factories;

use App\Models\Course;
use App\Models\Department;
use Illuminate\Database\Eloquent\Factories\Factory;

class CourseFactory extends Factory
{
    protected $model = Course::class;

    public function definition(): array
    {
        return [
            'name' => fake()->unique()->words(3, true),
            'code' => strtoupper(fake()->unique()->lexify('BS???')),
            'department_id' => Department::factory(),
            'is_board_program' => false,
            'board_exam_name' => null,
            'status' => 'active',
        ];
    }

    public function boardProgram(string $examName = 'Licensure Exam'): static
    {
        return $this->state(fn () => [
            'is_board_program' => true,
            'board_exam_name' => $examName,
        ]);
    }
}
