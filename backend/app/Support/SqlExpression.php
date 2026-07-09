<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;

/**
 * Small driver-aware SQL fragment builder.
 *
 * Keeps database-function differences (which vary between MySQL, SQLite, etc.)
 * in one place so query code stays portable — notably so the Phase 6 test suite
 * can run against SQLite while production runs on MySQL.
 *
 * Callers pass trusted, code-defined column identifiers only (never user input).
 */
class SqlExpression
{
    /**
     * Expression that formats a datetime column to a 'YYYY-MM' month key,
     * suitable for GROUP BY / SELECT.
     */
    public static function monthKey(string $column, ?string $connection = null): string
    {
        return match (DB::connection($connection)->getDriverName()) {
            'sqlite' => "strftime('%Y-%m', {$column})",
            'pgsql' => "to_char({$column}, 'YYYY-MM')",
            default => "DATE_FORMAT({$column}, '%Y-%m')", // mysql / mariadb
        };
    }
}
