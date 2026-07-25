<?php

namespace Database\Factories;

use App\Enums\EducationLevel;
use App\Models\Course;
use App\Models\Graduate;
use Illuminate\Database\Eloquent\Factories\Factory;

class GraduateFactory extends Factory
{
    protected $model = Graduate::class;

    public function definition(): array
    {
        return [
            'first_name' => fake()->firstName(),
            'middle_name' => fake()->optional(0.7)->lastName(),
            'last_name' => fake()->lastName(),
            'suffix' => null,
            'education_level' => EducationLevel::COLLEGE,
            'graduation_year' => fake()->numberBetween(2018, 2026),
            'department_id' => null,
            // Course has no HasFactory trait, so reference its factory directly.
            'course_id' => CourseFactory::new(),
            'alumni_id_number' => null,
            'user_id' => null,
        ];
    }

    /**
     * Auto-set department_id from the course's department.
     */
    public function configure(): static
    {
        return $this->afterCreating(function (Graduate $graduate) {
            if ($graduate->course_id && !$graduate->department_id) {
                $graduate->update([
                    'department_id' => $graduate->course?->department_id,
                ]);
            }
        });
    }

    public function forCourse(Course $course): static
    {
        return $this->state(fn () => [
            'course_id' => $course->id,
            'department_id' => $course->department_id,
            'education_level' => EducationLevel::COLLEGE,
        ]);
    }

    public function withUser(\App\Models\User $user): static
    {
        return $this->state(fn () => ['user_id' => $user->id]);
    }

    public function elementary(): static
    {
        return $this->state(fn () => [
            'education_level' => EducationLevel::ELEMENTARY,
            'course_id' => null,
        ]);
    }

    public function level(EducationLevel $level): static
    {
        return $this->state(fn () => ['education_level' => $level]);
    }
}
