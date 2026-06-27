<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — Main Entry Point
|--------------------------------------------------------------------------
|
| All routes prefixed with /api automatically by Laravel.
| Routes are split into modular files for maintainability.
|
*/

// ─── Auth Routes (Public + Authenticated) ────────────────
require __DIR__ . '/api/auth.php';

// ─── Admin Routes (Protected: auth + role:admin) ─────────
require __DIR__ . '/api/admin.php';

// ─── Alumni Routes (Protected: auth + role:alumni) ───────
require __DIR__ . '/api/alumni.php';
