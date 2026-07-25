<?php

namespace Database\Factories;

use App\Enums\DepartmentStatus;
use App\Models\Department;
use Illuminate\Database\Eloquent\Factories\Factory;

class DepartmentFactory extends Factory
{
    protected $model = Department::class;

    public function definition(): array
    {
        return [
            'name' => fake()->unique()->words(3, true) . ' Department',
            'code' => fake()->unique()->lexify('???'),
            'education_level' => 'college',
            'is_board_program' => false,
            'board_exam_name' => null,
            'status' => DepartmentStatus::ACTIVE,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['status' => DepartmentStatus::INACTIVE]);
    }

    public function level(string $level): static
    {
        return $this->state(fn () => ['education_level' => $level]);
    }
}
