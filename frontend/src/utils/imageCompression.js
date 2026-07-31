// ═══════════════════════════════════════════════════════════
//  FILE: frontend/src/utils/imageCompression.js
//  Client-side image resize/compress using the native Canvas API,
//  plus HEIC/HEIF → JPEG conversion for iPhone photos.
//
//  WHY THIS EXISTS:
//  1) Modern phone cameras (iPhone, Honor, Samsung, etc.) shoot
//     12MP-48MP photos that easily land at 4-10MB per file, well past
//     typical upload limits. Rather than raising the size limit (which
//     slows uploads on mobile data), we downscale + re-encode the image
//     in the browser before it's ever sent.
//  2) iPhones default to saving photos as HEIC/HEIF, a format almost no
//     browser other than Safari can decode or preview. We convert HEIC
//     to JPEG in the browser first so the upload works and previews
//     correctly everywhere — alumni's phone, admin's desktop, any browser.
// ═══════════════════════════════════════════════════════════

// Note: heic2any is intentionally NOT imported at the top of this file.
// It's a large library (HEIC decoding engine), so importing it statically
// would bundle it into every page that touches this file, even for users
// who never upload a HEIC photo. We load it dynamically, only the moment
// an actual HEIC file is detected — see convertHeicIfNeeded() below.

const HEIC_TYPES = ["image/heic", "image/heif"];

function isHeic(file) {
  if (HEIC_TYPES.includes(file.type)) return true;
  // Some browsers/OS report an empty or generic type for HEIC files —
  // fall back to checking the file extension.
  return /\.(heic|heif)$/i.test(file.name || "");
}

/**
 * Convert a HEIC/HEIF file to JPEG in the browser. Returns the original
 * file unchanged if it isn't HEIC.
 *
 * @param {File} file
 * @returns {Promise<File>}
 */
export async function convertHeicIfNeeded(file) {
  if (!isHeic(file)) return file;

  // Dynamic import: the heic2any library (and its decoding engine) is only
  // downloaded by the browser at this point — when a HEIC file is actually
  // being uploaded — instead of being bundled into every page load.
  const { default: heic2any } = await import("heic2any");

  const convertedBlob = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.9,
  });

  // heic2any can return an array of blobs for multi-image HEIC containers
  // (e.g. Live Photos) — we only want the first/primary image.
  const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
  const baseName = file.name.replace(/\.[^/.]+$/, "");

  return new File([blob], `${baseName}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

/**
 * Resize and re-compress an image file entirely in the browser.
 *
 * @param {File} file - the original image file (jpeg/png/webp)
 * @param {Object} options
 * @param {number} options.maxWidth - max output width in px (default 1600)
 * @param {number} options.maxHeight - max output height in px (default 1600)
 * @param {number} options.quality - JPEG/WebP quality 0-1 (default 0.8)
 * @param {string} options.mimeType - output mime type (default "image/jpeg")
 * @returns {Promise<File>} a new, smaller File with the same base name
 */
export function compressImage(
  file,
  {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.8,
    mimeType = "image/jpeg",
  } = {},
) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Scale down proportionally so neither dimension exceeds the max.
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Image compression failed."));
            return;
          }
          // Keep the original name but normalize the extension to match
          // the re-encoded mime type (canvas always re-encodes as jpeg/webp/png).
          const ext =
            mimeType === "image/png"
              ? "png"
              : mimeType === "image/webp"
                ? "webp"
                : "jpg";
          const baseName = file.name.replace(/\.[^/.]+$/, "");
          const compressedFile = new File([blob], `${baseName}.${ext}`, {
            type: mimeType,
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        },
        mimeType,
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read the selected image."));
    };

    img.src = objectUrl;
  });
}

/**
 * Full pipeline for a phone-camera upload: convert HEIC → JPEG if needed,
 * then compress only if the result is still larger than targetMaxBytes.
 * Use this instead of compressImageIfNeeded when the source may be HEIC
 * (e.g. any profile/document picture upload coming from a phone).
 *
 * @param {File} file
 * @param {number} targetMaxBytes - skip compression if file is already under this size
 * @param {Object} compressOptions - passed through to compressImage()
 */
export async function prepareImageForUpload(
  file,
  targetMaxBytes,
  compressOptions = {},
) {
  let workingFile = file;
  try {
    workingFile = await convertHeicIfNeeded(file);
  } catch {
    // If HEIC decoding fails (corrupt file, unsupported variant), fall
    // back to the original file so the normal type-check error message
    // fires instead of a silent crash.
    workingFile = file;
  }
  return compressImageIfNeeded(workingFile, targetMaxBytes, compressOptions);
}

/**
 * Compress only if the file is larger than the target size; otherwise
 * return the original file untouched (avoids needlessly re-encoding
 * already-small images and losing quality for no reason).
 *
 * @param {File} file
 * @param {number} targetMaxBytes - skip compression if file is already under this size
 * @param {Object} compressOptions - passed through to compressImage()
 */
export async function compressImageIfNeeded(
  file,
  targetMaxBytes,
  compressOptions = {},
) {
  if (file.size <= targetMaxBytes) return file;
  try {
    const compressed = await compressImage(file, compressOptions);
    return compressed;
  } catch {
    // If compression fails for any reason (e.g. unsupported format),
    // fall back to the original file so the existing size-check error
    // message still fires normally instead of a silent crash.
    return file;
  }
}
