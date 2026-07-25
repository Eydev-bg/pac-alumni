<?php

namespace Database\Factories;

use App\Models\Event;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class EventFactory extends Factory
{
    protected $model = Event::class;

    public function definition(): array
    {
        $start = now()->addWeek();

        return [
            'admin_id' => User::factory()->admin(),
            'title' => fake()->sentence(4),
            'content' => '<p>' . fake()->paragraph() . '</p>',
            'image' => null,
            'target_type' => 'all',
            'target_value' => null,
            'is_published' => false,
            'is_pinned' => false,
            'published_at' => null,
            'archived_at' => null,
            'start_datetime' => $start,
            'end_datetime' => (clone $start)->addHours(4),
            'location' => fake()->streetAddress(),
        ];
    }

    public function published(): static
    {
        return $this->state(fn () => [
            'is_published' => true,
            'published_at' => now(),
        ]);
    }

    public function pinned(): static
    {
        return $this->state(fn () => ['is_pinned' => true]);
    }

    public function archived(): static
    {
        return $this->state(fn () => ['archived_at' => now()]);
    }
}
