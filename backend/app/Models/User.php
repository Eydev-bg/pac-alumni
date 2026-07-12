<?php

namespace App\Models;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use HasFactory, Notifiable;

    // ─── Mass Assignment Protection ──────────────────────────
    protected $fillable = [
        'uuid',
        'email',
        'password',
        'role',
        'first_name',
        'middle_name',
        'last_name',
        'suffix',
        'phone',
        'profile_picture',
        'status',
        'email_verified_at',
        'last_login_at',
        'last_login_ip',
        'last_profile_update_at',
    ];

    // ─── Hidden from JSON/Array ──────────────────────────────
    // SECURITY: Never expose passwords or tokens in API responses
    protected $hidden = [
        'password',
        'remember_token',
        'id', // Never expose numeric ID — use UUID
    ];

    // ─── Attribute Casting ───────────────────────────────────
    protected function casts(): array
    {
        return [
            'role' => UserRole::class,
            'status' => UserStatus::class,
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'last_profile_update_at' => 'datetime',
            'password' => 'hashed', // Auto-hash on set (Laravel 10+)
        ];
    }

    // ─── Boot: Auto-generate UUID ────────────────────────────
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (User $user) {
            if (empty($user->uuid)) {
                $user->uuid = (string) Str::uuid();
            }
        });
    }

    // ─── Route Model Binding by UUID ─────────────────────────
    // SECURITY: Routes use UUID, not numeric ID
    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    // ─── JWT Methods ─────────────────────────────────────────
    public function getJWTIdentifier(): mixed
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims(): array
    {
        return [
            'uuid' => $this->uuid,
            'role' => $this->role->value,
            // SECURITY: Binds the token to the current password. When the password
            // changes this fingerprint changes, so tokens issued beforehand no
            // longer validate (see EnsureTokenPasswordIsCurrent middleware).
            'pwf' => $this->passwordFingerprint(),
        ];
    }

    /**
     * Short, non-reversible fingerprint of the current (hashed) password.
     * Used as a JWT claim to invalidate stale tokens after a password change.
     */
    public function passwordFingerprint(): string
    {
        return substr(hash('sha256', (string) $this->password), 0, 16);
    }

    // ─── Relationships ───────────────────────────────────────
    public function loginActivityLogs(): HasMany
    {
        return $this->hasMany(LoginActivityLog::class);
    }

    public function emailReminderLogs(): HasMany
    {
        return $this->hasMany(EmailReminderLog::class);
    }

    public function alumniProfile(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(AlumniProfile::class);
    }

    // ─── Accessors ───────────────────────────────────────────
    public function getFullNameAttribute(): string
    {
        $parts = array_filter([
            $this->first_name,
            $this->middle_name,
            $this->last_name,
            $this->suffix,
        ]);

        return implode(' ', $parts);
    }

    // ─── Query Scopes ────────────────────────────────────────
    public function scopeActive($query)
    {
        return $query->where('status', UserStatus::ACTIVE);
    }

    public function scopeByRole($query, UserRole $role)
    {
        return $query->where('role', $role);
    }

    public function scopeSearch($query, ?string $search)
    {
        if (empty($search)) {
            return $query;
        }

        return $query->where(function ($q) use ($search) {
            $q->where('first_name', 'LIKE', "%{$search}%")
                ->orWhere('last_name', 'LIKE', "%{$search}%")
                ->orWhere('email', 'LIKE', "%{$search}%");
        });
    }

    // ─── Helper Methods ──────────────────────────────────────
    public function isAdmin(): bool
    {
        return $this->role === UserRole::ADMIN;
    }

    public function isActive(): bool
    {
        return $this->status === UserStatus::ACTIVE;
    }

    public function canLogin(): bool
    {
        return $this->status->canLogin();
    }
}
