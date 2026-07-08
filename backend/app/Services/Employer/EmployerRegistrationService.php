<?php

namespace App\Services\Employer;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Employer;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class EmployerRegistrationService
{
    /**
     * Register a new employer (HR) account.
     *
     * The FormRequest guarantees all required fields and the business permit
     * upload are present, so reaching this method means the account qualifies
     * for auto-approval (is_verified = true, status = active).
     *
     * @return array{token: string, token_type: string, expires_in: int, user: User, employer: Employer}
     */
    public function register(array $data, UploadedFile $businessPermit, ?UploadedFile $logo = null): array
    {
        return DB::transaction(function () use ($data, $businessPermit, $logo) {
            // ─── Step 1: Create the user account ─────────────
            [$firstName, $lastName] = $this->splitName($data['hr_full_name']);

            $user = User::create([
                'email'             => $data['email'],
                'password'          => $data['password'],
                'role'              => UserRole::EMPLOYER,
                'status'            => UserStatus::ACTIVE,
                'first_name'        => $firstName,
                'last_name'         => $lastName,
                'phone'             => $data['company_contact_number'],
                'email_verified_at' => now(),
            ]);

            // ─── Step 2: Store uploaded documents ────────────
            $permitPath = $this->storeFile($businessPermit, 'business_permits', $user->uuid);
            $logoPath   = $logo ? $this->storeFile($logo, 'company_logos', $user->uuid) : null;

            // ─── Step 3: Create the employer record (auto-approved) ──
            $employer = Employer::create([
                'user_id'                  => $user->id,
                'company_name'             => $data['company_name'],
                'company_email'            => $data['company_email'],
                'company_address'          => $data['company_address'],
                'company_contact_number'   => $data['company_contact_number'],
                'company_website'          => $data['company_website'] ?? null,
                'company_logo'             => $logoPath,
                'business_permit_document' => $permitPath,
                'hr_full_name'             => $data['hr_full_name'],
                'hr_position'              => $data['hr_position'],
                'is_verified'              => true,
                'status'                   => 'active',
            ]);

            // ─── Step 4: Notify admins of the auto-approved account ──
            $this->notifyAdmins($employer);

            // ─── Step 5: Issue a JWT for the new account ─────
            $token = JWTAuth::fromUser($user);

            return [
                'token'      => $token,
                'token_type' => 'bearer',
                'expires_in' => JWTAuth::factory()->getTTL() * 60, // seconds
                'user'       => $user,
                'employer'   => $employer,
            ];
        });
    }

    /**
     * Store an uploaded file on the public disk and return its public path.
     */
    private function storeFile(UploadedFile $file, string $folder, string $uuid): string
    {
        $filename = $folder . '/' . $uuid . '_' . time() . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs('', $filename, 'public');

        return '/storage/' . $path;
    }

    /**
     * Notify all active admins that a new HR account was auto-approved.
     */
    private function notifyAdmins(Employer $employer): void
    {
        $admins = User::where('role', UserRole::ADMIN)
            ->where('status', UserStatus::ACTIVE->value)
            ->pluck('id');

        foreach ($admins as $adminId) {
            Notification::create([
                'user_id' => $adminId,
                'type'    => 'employer_registered',
                'title'   => 'New HR Account Auto-Approved',
                'message' => "{$employer->company_name} registered an HR account and was auto-approved.",
                'data'    => [
                    'employer_id'  => $employer->id,
                    'company_name' => $employer->company_name,
                    'hr_full_name' => $employer->hr_full_name,
                ],
            ]);
        }
    }

    /**
     * Split a full name into [first_name, last_name] for the users table,
     * which requires both columns to be non-null.
     */
    private function splitName(string $fullName): array
    {
        $parts = preg_split('/\s+/', trim($fullName));
        $firstName = array_shift($parts);

        return [$firstName, count($parts) ? implode(' ', $parts) : $firstName];
    }
}
