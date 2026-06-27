<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'admin@pac.edu.ph'],
            [
                'first_name' => 'System',
                'last_name' => 'Administrator',
                'password' => 'P@cAdmin2026!',
                'role' => UserRole::ADMIN,
                'status' => UserStatus::ACTIVE,
                'email_verified_at' => now(),
            ]
        );

        $this->command->info('Default admin created: admin@pac.edu.ph / P@cAdmin2026!');
    }
}
