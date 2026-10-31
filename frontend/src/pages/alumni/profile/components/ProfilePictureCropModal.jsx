import { useState, useCallback, useEffect, useId } from "react";
import { createPortal } from "react-dom";
import Cropper from "react-easy-crop";
import {
  HiOutlineMagnifyingGlassMinus,
  HiOutlineMagnifyingGlassPlus,
} from "react-icons/hi2";
import useModalA11y from "../../../../hooks/useModalA11y";
import { getCroppedImageFile } from "../../../../utils/cropImage";
import { btnPrimary, btnGhost } from "../styles";

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

/**
 * Facebook-style crop step for the profile picture: a round frame the user
 * drags/zooms to place their face, then Save hands the parent a square JPEG.
 * Mounted only while open, so useModalA11y's mount/unmount = open/close.
 */
export default function ProfilePictureCropModal({
  imageSrc,
  fileName,
  onCancel,
  onSave,
  onError,
  saving = false,
}) {
  const titleId = useId();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [cropping, setCropping] = useState(false);
  const busy = saving || cropping;

  // Escape / Cancel are ignored while the upload is in flight.
  const handleCancel = useCallback(() => {
    if (!busy) onCancel();
  }, [busy, onCancel]);
  const panelRef = useModalA11y(handleCancel);

  // Lock page scroll behind the modal, same as the photo action sheet.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const handleCropComplete = useCallback((_area, areaPixels) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels || busy) return;
    setCropping(true);
    let file;
    try {
      file = await getCroppedImageFile(imageSrc, croppedAreaPixels, fileName);
    } catch (err) {
      onError?.(err?.message || "Could not crop this image.");
      return;
    } finally {
      setCropping(false);
    }
    onSave(file);
  };

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={handleCancel}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-md overflow-hidden rounded-t-2xl bg-white shadow-2xl focus:outline-none dark:bg-slate-800 sm:rounded-2xl"
      >
        <div className="px-4 pt-4 pb-3 sm:px-5">
          <h2
            id={titleId}
            className="text-base font-semibold text-slate-800 dark:text-slate-100"
          >
            Crop profile picture
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Drag to position your face and shoulders inside the circle.
          </p>
        </div>

        <div className="relative h-72 bg-slate-900 sm:h-80">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            minZoom={MIN_ZOOM}
            maxZoom={MAX_ZOOM}
            aspect={1}
            cropShape="round"
            showGrid={false}
            objectFit="contain"
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
          />
        </div>

        <div className="flex items-center gap-3 px-4 py-4 sm:px-5">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(MIN_ZOOM, +(z - 0.1).toFixed(2)))}
            disabled={busy}
            aria-label="Zoom out"
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-white/[0.06]"
          >
            <HiOutlineMagnifyingGlassMinus className="h-5 w-5" />
          </button>
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            disabled={busy}
            aria-label="Zoom"
            className="h-10 min-w-0 flex-1 cursor-pointer accent-blue-600 disabled:cursor-not-allowed"
          />
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(MAX_ZOOM, +(z + 0.1).toFixed(2)))}
            disabled={busy}
            aria-label="Zoom in"
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-white/[0.06]"
          >
            <HiOutlineMagnifyingGlassPlus className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] dark:border-slate-700 sm:flex-row sm:justify-end sm:px-5 sm:pb-4">
          <button
            type="button"
            onClick={handleCancel}
            disabled={busy}
            className={`${btnGhost} w-full sm:w-auto`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!croppedAreaPixels || busy}
            className={`${btnPrimary} w-full sm:w-auto`}
          >
            {busy ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Saving…
              </>
            ) : (
              "Save"
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
