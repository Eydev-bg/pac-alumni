<?php

namespace Tests\Feature\Admin;

use App\Models\Graduate;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Tests\TestCase;

class AlumniIdCardTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsAdmin(): User
    {
        $admin = User::factory()->admin()->create();
        $this->withHeader('Authorization', 'Bearer ' . JWTAuth::fromUser($admin));

        return $admin;
    }

    public function test_admin_downloads_college_graduate_card_as_pdf(): void
    {
        $graduate = Graduate::factory()->create(['alumni_id_number' => 'PAC-2024-0001']);
        $this->actingAsAdmin();

        $response = $this->get("/api/admin/graduates/{$graduate->id}/id-card");

        $response->assertOk();
        $this->assertStringStartsWith('application/pdf', $response->headers->get('Content-Type'));
        $this->assertStringStartsWith('%PDF', $response->getContent());
    }

    public function test_card_pdf_has_front_and_back_pages(): void
    {
        $graduate = Graduate::factory()->create(['alumni_id_number' => 'PAC-2024-0002']);
        $this->actingAsAdmin();

        $pdf = $this->get("/api/admin/graduates/{$graduate->id}/id-card")
            ->assertOk()
            ->getContent();

        $this->assertSame(2, preg_match_all('#/Type\s*/Page(?!s)#', $pdf));
    }

    public function test_non_college_graduate_is_forbidden(): void
    {
        $graduate = Graduate::factory()->elementary()->create(['alumni_id_number' => 'PAC-2024-0003']);
        $this->actingAsAdmin();

        $this->getJson("/api/admin/graduates/{$graduate->id}/id-card")
            ->assertForbidden();
    }
}
