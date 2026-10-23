<?php

namespace App\Services\Admin;

use App\Enums\EducationLevel;
use App\Exceptions\DomainException;
use App\Models\Graduate;
use App\Services\StorageService;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Support\Facades\Log;

/**
 * Renders a single printable Alumni ID card (CR80, landscape) as a PDF.
 *
 * Images are always embedded as base64 data URIs so dompdf never has to
 * resolve a relative "/storage/..." URL or make a remote request — that
 * keeps isRemoteEnabled off and works the same for local and cloud disks.
 */
class AlumniIdCardService
{
    /**
     * CR80 card in points (1in = 72pt): 2.125in × 3.375in. Passed as
     * portrait and flipped by dompdf's "landscape" → 243pt wide × 153pt tall.
     */
    private const PAPER_CR80 = [0, 0, 153, 243];

    /**
     * Photo box is 76×92px in the template; embed at 3× for crisp print.
     */
    private const PHOTO_WIDTH = 228;
    private const PHOTO_HEIGHT = 276;

    public function __construct(
        protected GraduateService $graduateService,
    ) {}

    /**
     * Build the card PDF for a graduate.
     *
     * @return array{pdf: string, alumni_id_number: string}
     */
    public function generateForGraduate(int $graduateId): array
    {
        // findById() already eager-loads course.department and user.
        $graduate = $this->graduateService->findById($graduateId);

        // Alumni IDs are issued to college graduates only.
        if ($graduate->education_level !== EducationLevel::COLLEGE) {
            throw DomainException::forbidden(
                'Alumni ID cards are issued to college graduates only.'
            );
        }

        if (!$graduate->hasAlumniId()) {
            throw DomainException::unprocessable(
                'This graduate has no Alumni ID yet and cannot be issued an ID card.'
            );
        }

        $html = view('id-cards.alumni', $this->buildViewModel($graduate))->render();

        $options = new Options();
        $options->set('isRemoteEnabled', false);
        $options->set('dpi', 96);
        $options->set('defaultFont', 'Helvetica');

        $dompdf = new Dompdf($options);
        $dompdf->setPaper(self::PAPER_CR80, 'landscape');
        $dompdf->loadHtml($html);
        $dompdf->render();

        return [
            'pdf' => $dompdf->output(),
            'alumni_id_number' => $graduate->alumni_id_number,
        ];
    }

    private function buildViewModel(Graduate $graduate): array
    {
        return [
            'fullName' => $graduate->full_name,
            'alumniIdNumber' => $graduate->alumni_id_number,
            // Full course name; falls back to the course code if the name is blank.
            'program' => $graduate->course?->name ?: $graduate->course_code ?: '',
            'graduationYear' => $graduate->graduation_year,
            'educationLevel' => $graduate->education_level?->value,
            'initials' => $this->initials($graduate),
            'photo' => $this->resolvePhoto($graduate),
            'logo' => $this->resolveLogo(),
        ];
    }

    /**
     * First letter of first + last name. Empty string triggers the
     * silhouette fallback in the template.
     */
    private function initials(Graduate $graduate): string
    {
        return mb_strtoupper(
            mb_substr(trim((string) $graduate->first_name), 0, 1)
            . mb_substr(trim((string) $graduate->last_name), 0, 1)
        );
    }

    /**
     * Resolve the alumnus' profile picture to a data URI, or null.
     *
     * Reads the RAW stored path (the model accessor returns a URL) and pulls
     * the bytes through the configured upload disk, so the same call works
     * for the local 'public' disk and for cloud disks (supabase/s3). Legacy
     * absolute "http..." values can't be mapped to a disk path and fall back
     * to the initials placeholder. Any failure falls back too — a missing
     * photo must never break the card.
     */
    private function resolvePhoto(Graduate $graduate): ?string
    {
        $stored = $graduate->user?->getRawOriginal('profile_picture');
        if (!$stored) {
            return null;
        }

        $path = StorageService::extractPath($stored);
        if (!$path) {
            return null;
        }

        try {
            $disk = StorageService::disk();
            if (!$disk->exists($path)) {
                return null;
            }

            return $this->toDataUri($this->cropToPhotoBox((string) $disk->get($path)));
        } catch (\Throwable $e) {
            Log::warning('Alumni ID card: could not embed profile picture.', [
                'graduate_id' => $graduate->id,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Center-crop and downscale the photo to the card's photo-box ratio.
     * dompdf ignores object-fit, so an un-cropped photo would be stretched.
     * Returns the original bytes if GD can't decode the image.
     */
    private function cropToPhotoBox(string $bytes): string
    {
        $src = @imagecreatefromstring($bytes);
        if ($src === false) {
            return $bytes;
        }

        $srcW = imagesx($src);
        $srcH = imagesy($src);
        $ratio = self::PHOTO_WIDTH / self::PHOTO_HEIGHT;

        if ($srcW / $srcH > $ratio) {
            $cropH = $srcH;
            $cropW = (int) round($srcH * $ratio);
        } else {
            $cropW = $srcW;
            $cropH = (int) round($srcW / $ratio);
        }
        $cropX = (int) (($srcW - $cropW) / 2);
        $cropY = (int) (($srcH - $cropH) / 2);

        $dst = imagecreatetruecolor(self::PHOTO_WIDTH, self::PHOTO_HEIGHT);
        imagefill($dst, 0, 0, imagecolorallocate($dst, 255, 255, 255));
        imagecopyresampled($dst, $src, 0, 0, $cropX, $cropY, self::PHOTO_WIDTH, self::PHOTO_HEIGHT, $cropW, $cropH);

        ob_start();
        imagejpeg($dst, null, 90);
        $out = (string) ob_get_clean();

        imagedestroy($src);
        imagedestroy($dst);

        return $out !== '' ? $out : $bytes;
    }

    /**
     * Prefer the transparent PNG; fall back to the legacy JPG on older deploys.
     */
    private function resolveLogo(): ?string
    {
        foreach (['pac-logo.png', 'pac-logo.jpg'] as $file) {
            $path = public_path($file);
            if (is_file($path)) {
                return $this->toDataUri((string) file_get_contents($path));
            }
        }

        return null;
    }

    /**
     * Encode image bytes as a data URI, sniffing the type from content.
     * Returns null for empty or non-image payloads.
     */
    private function toDataUri(string $bytes): ?string
    {
        if ($bytes === '') {
            return null;
        }

        $mime = (new \finfo(FILEINFO_MIME_TYPE))->buffer($bytes);
        if (!in_array($mime, ['image/jpeg', 'image/png', 'image/gif', 'image/webp'], true)) {
            return null;
        }

        return 'data:' . $mime . ';base64,' . base64_encode($bytes);
    }
}
