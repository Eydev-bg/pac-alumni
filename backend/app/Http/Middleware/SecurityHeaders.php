<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Attaches HTTP security headers to every response.
 *
 * Header values are driven entirely by config/security.php (env-overridable),
 * so policies can be tuned per environment without touching code. HSTS is only
 * emitted over HTTPS in production to avoid pinning local/HTTP development.
 */
class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        foreach (config('security.headers', []) as $header => $value) {
            if ($value !== null && $value !== '') {
                $response->headers->set($header, $value);
            }
        }

        $this->applyHsts($request, $response);

        return $response;
    }

    /**
     * HSTS is only meaningful over HTTPS and is restricted to production so it
     * never accidentally pins a developer's browser to HTTPS on localhost.
     */
    private function applyHsts(Request $request, Response $response): void
    {
        $hsts = config('security.hsts', []);

        if (empty($hsts['enabled']) || !$request->isSecure() || !app()->environment('production')) {
            return;
        }

        $value = 'max-age=' . (int) ($hsts['max_age'] ?? 0);

        if (!empty($hsts['include_subdomains'])) {
            $value .= '; includeSubDomains';
        }

        if (!empty($hsts['preload'])) {
            $value .= '; preload';
        }

        $response->headers->set('Strict-Transport-Security', $value);
    }
}
