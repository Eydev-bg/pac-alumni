<?php

namespace App\Providers;

use App\Repositories\Contracts\DepartmentRepositoryInterface;
use App\Repositories\Contracts\GraduateRepositoryInterface;
use App\Repositories\Contracts\LoginActivityLogRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Repositories\Eloquent\DepartmentRepository;
use App\Repositories\Eloquent\GraduateRepository;
use App\Repositories\Eloquent\LoginActivityLogRepository;
use App\Repositories\Eloquent\UserRepository;
use Illuminate\Support\ServiceProvider;

class RepositoryServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(UserRepositoryInterface::class, UserRepository::class);
        $this->app->bind(LoginActivityLogRepositoryInterface::class, LoginActivityLogRepository::class);
        $this->app->bind(DepartmentRepositoryInterface::class, DepartmentRepository::class);
        $this->app->bind(GraduateRepositoryInterface::class, GraduateRepository::class);
    }

    public function boot(): void
    {
        //
    }
}
