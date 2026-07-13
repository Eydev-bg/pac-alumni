<?php

namespace App\Http\Middleware;

use App\Traits\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    use ApiResponse;

    /**
     * Handle an incoming request.
     *
     * Usage in routes: middleware('role:admin') or middleware('role:admin,alumni')
     * Valid roles are defined by the UserRole enum (admin, alumni).
     *
     * @param string $roles Comma-separated list of allowed roles
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return $this->unauthorized('Authentication required.');
        }

        // Check if user's role is in the allowed roles
        $allowedRoles = collect($roles)->flatMap(fn($r) => explode(',', $r))->toArray();

        if (!in_array($user->role->value, $allowedRoles)) {
            return $this->forbidden('You do not have permission to access this resource.');
        }

        return $next($request);
    }

    
}
