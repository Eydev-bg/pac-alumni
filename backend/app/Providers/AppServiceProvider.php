<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Named rate limiter for the public landing-stats endpoint.
        // Isolated (per-IP) so its counter does NOT share the anonymous
        // sha1(domain|ip) bucket that inline numeric throttles use on
        // unauthenticated routes — otherwise a burst of stats polls would
        // spill 429s onto /auth/* and /registration/* on the same IP.
        RateLimiter::for('landing-stats', function (Request $request) {
            return Limit::perMinute(120)->by($request->ip());
        });
    }
}
