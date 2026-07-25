<?php

namespace Database\Factories;

use App\Enums\JobEmploymentType;
use App\Enums\JobStatus;
use App\Models\JobPosting;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class JobPostingFactory extends Factory
{
    protected $model = JobPosting::class;

    public function definition(): array
    {
        return [
            'posted_by' => User::factory()->admin(),
            'company_name' => fake()->company(),
            'company_logo' => null,
            'job_position' => fake()->jobTitle(),
            'location' => fake()->city(),
            'employment_type' => JobEmploymentType::FULL_TIME,
            'salary' => null,
            'benefits' => null,
            'description' => fake()->paragraph(),
            'requirements' => null,
            'application_link' => 'https://example.test/apply',
            'company_email' => null,
            'application_deadline' => null,
            'status' => JobStatus::DRAFT,
            'is_pinned' => false,
            'published_at' => null,
        ];
    }

    public function active(): static
    {
        return $this->state(fn () => [
            'status' => JobStatus::ACTIVE,
            'published_at' => now(),
        ]);
    }

    public function expired(): static
    {
        return $this->state(fn () => ['status' => JobStatus::EXPIRED]);
    }
}
