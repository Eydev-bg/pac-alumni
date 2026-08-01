<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Symfony\Component\Mailer\Bridge\Brevo\Transport\BrevoTransportFactory;
use Symfony\Component\Mailer\Transport\Dsn;

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

        // Brevo transactional email over HTTPS (not SMTP). Railway blocks
        // outbound SMTP ports (25/465/587) on the Hobby/Free plan, so mail
        // sent via smtp-relay.brevo.com:587 times out there even though it
        // works from a local machine. The "brevo+api" DSN sends over HTTPS
        // instead, which Railway does not block. See config/mail.php for
        // the "brevo" mailer entry that uses this transport.
        Mail::extend('brevo', function () {
            return (new BrevoTransportFactory)->create(
                new Dsn('brevo+api', 'default', config('services.brevo.key'))
            );
        });
    }
}
