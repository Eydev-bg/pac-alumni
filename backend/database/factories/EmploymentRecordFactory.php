<?php

namespace Database\Factories;

use App\Enums\EmploymentType;
use App\Models\EmploymentRecord;
use App\Models\Graduate;
use Illuminate\Database\Eloquent\Factories\Factory;

class EmploymentRecordFactory extends Factory
{
    protected $model = EmploymentRecord::class;

    public function definition(): array
    {
        return [
            'graduate_id' => Graduate::factory(),
            'company_name' => fake()->company(),
            'job_title' => fake()->jobTitle(),
            'industry' => fake()->randomElement(['IT', 'Education', 'Healthcare', 'Engineering', 'Finance']),
            'employment_type' => fake()->randomElement(EmploymentType::cases()),
            'start_date' => fake()->dateTimeBetween('-2 years', 'now'),
            'end_date' => null,
            'is_current' => true,
        ];
    }

    public function notCurrent(): static
    {
        return $this->state(fn () => [
            'is_current' => false,
            'end_date' => fake()->dateTimeBetween('-6 months', 'now'),
        ]);
    }

    public function type(EmploymentType $type): static
    {
        return $this->state(fn () => ['employment_type' => $type]);
    }
}
