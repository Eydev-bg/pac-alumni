<?php

namespace Tests\Feature\Alumni\Settings;

use App\Models\AlumniProfile;
use App\Models\Graduate;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AppearanceSettingsTest extends TestCase
{
    use RefreshDatabase;

    private const ENDPOINT = '/api/alumni/settings/appearance';

    /**
     * Create an active alumnus with a linked (empty) alumni profile.
     *
     * @return array{0: User, 1: AlumniProfile}
     */
    private function createAlumniWithProfile(): array
    {
        $user = User::factory()->create();

        $graduate = Graduate::create([
            'first_name'      => 'Test',
            'last_name'       => 'Alumni',
            'education_level' => 'college',
            'graduation_year' => 2020,
            'user_id'         => $user->id,
        ]);

        $profile = AlumniProfile::create([
            'user_id'     => $user->id,
            'graduate_id' => $graduate->id,
        ]);

        return [$user, $profile];
    }

    public function test_get_returns_system_when_preferences_is_null(): void
    {
        [$user, $profile] = $this->createAlumniWithProfile();
        $this->assertNull($profile->preferences);

        $response = $this->actingAs($user, 'api')->getJson(self::ENDPOINT);

        $response->assertOk();
        $response->assertJsonPath('data.theme', 'system');
    }

    public function test_patch_light_then_dark_persists_correctly(): void
    {
        [$user, $profile] = $this->createAlumniWithProfile();

        $this->actingAs($user, 'api')
            ->patchJson(self::ENDPOINT, ['theme' => 'light'])
            ->assertOk()
            ->assertJsonPath('data.theme', 'light');

        $this->assertSame('light', $profile->fresh()->preferences['theme']);

        $this->actingAs($user, 'api')
            ->patchJson(self::ENDPOINT, ['theme' => 'dark'])
            ->assertOk()
            ->assertJsonPath('data.theme', 'dark');

        $this->assertSame('dark', $profile->fresh()->preferences['theme']);
    }

    public function test_patch_with_an_invalid_theme_returns_422(): void
    {
        [$user] = $this->createAlumniWithProfile();

        $response = $this->actingAs($user, 'api')
            ->patchJson(self::ENDPOINT, ['theme' => 'blue']);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['theme']);
    }

    public function test_patch_preserves_other_keys_already_in_the_preferences_json(): void
    {
        [$user, $profile] = $this->createAlumniWithProfile();

        // Seed an unrelated preference key that must survive a theme write.
        $profile->update(['preferences' => ['locale' => 'en']]);

        $this->actingAs($user, 'api')
            ->patchJson(self::ENDPOINT, ['theme' => 'dark'])
            ->assertOk()
            ->assertJsonPath('data.theme', 'dark');

        $prefs = $profile->fresh()->preferences;

        // Regression guard for the merge-not-overwrite requirement.
        $this->assertSame('en', $prefs['locale']);
        $this->assertSame('dark', $prefs['theme']);
    }
}
