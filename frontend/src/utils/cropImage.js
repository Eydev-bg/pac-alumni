/**
 * Profile picture crop helper.
 *
 * Draws the region the user picked in react-easy-crop onto a square canvas
 * and returns it as a JPEG File. The output is always a plain square — the
 * round frame is UI-only (like Facebook), and avatars apply their own
 * rounding — so the face stays centered wherever the photo is shown.
 */

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load the image to crop."));
    img.src = src;
  });
}

/**
 * @param {string} imageSrc - object URL of the source image
 * @param {{x:number, y:number, width:number, height:number}} cropPixels -
 *   croppedAreaPixels from react-easy-crop's onCropComplete
 * @param {string} fileName - original file name (extension is replaced)
 * @param {{size?: number, quality?: number}} options
 * @returns {Promise<File>} size×size JPEG
 */
export async function getCroppedImageFile(
  imageSrc,
  cropPixels,
  fileName,
  { size = 800, quality = 0.85 } = {},
) {
  const img = await loadImage(imageSrc);

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser could not prepare the image.");

  // JPEG has no alpha — fill white so transparent PNGs don't turn black.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    img,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    size,
    size,
  );

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );
  if (!blob) throw new Error("Could not create the cropped image.");

  const baseName = (fileName || "profile").replace(/\.[^/.]+$/, "") || "profile";
  return new File([blob], `${baseName}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}
