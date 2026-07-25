<?php

namespace Database\Factories;

use App\Enums\BoardStatus;
use App\Enums\EmploymentStatus;
use App\Models\AlumniProfile;
use App\Models\Graduate;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class AlumniProfileFactory extends Factory
{
    protected $model = AlumniProfile::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'graduate_id' => Graduate::factory(),
            'current_location' => fake()->optional()->city(),
            'employment_status' => EmploymentStatus::UNKNOWN,
            'board_status' => BoardStatus::NOT_TAKEN,
            'is_directory_visible' => true,
            'preferences' => null,
        ];
    }

    public function employed(): static
    {
        return $this->state(fn () => ['employment_status' => EmploymentStatus::EMPLOYED]);
    }

    public function unemployed(): static
    {
        return $this->state(fn () => ['employment_status' => EmploymentStatus::UNEMPLOYED]);
    }

    public function boardPassed(): static
    {
        return $this->state(fn () => ['board_status' => BoardStatus::PASSED]);
    }
}
