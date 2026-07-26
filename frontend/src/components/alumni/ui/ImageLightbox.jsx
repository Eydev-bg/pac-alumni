// ═══════════════════════════════════════════════════════════
//  FILE: frontend/src/components/alumni/ui/ImageLightbox.jsx
//  Reusable full-size image viewer. A dark, click-to-close backdrop with
//  the image centered and scaled to fit the viewport. Fades in on mount and
//  closes on Escape. Callers own the open/close state:
//
//    const [lightboxSrc, setLightboxSrc] = useState(null);
//    <img onClick={() => setLightboxSrc(url)} className="cursor-pointer" ... />
//    {lightboxSrc && (
//      <ImageLightbox src={lightboxSrc} alt="Profile"
//                     onClose={() => setLightboxSrc(null)} />
//    )}
// ═══════════════════════════════════════════════════════════

import { useEffect, useState } from "react";
import { HiOutlineXMark } from "react-icons/hi2";

export default function ImageLightbox({ src, alt = "Image", onClose }) {
  // Drive a mount-in opacity transition so the overlay fades in smoothly
  // without depending on any global keyframes.
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Close on Escape and lock body scroll while open.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onClose}
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity duration-200 ${
        shown ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Close (X) — top-right corner. */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close image viewer"
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
      >
        <HiOutlineXMark className="w-6 h-6" />
      </button>

      {/* Stop propagation so clicking the image itself doesn't close. */}
      <img
        src={src}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        className={`max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl transition-transform duration-200 ${
          shown ? "scale-100" : "scale-95"
        }`}
      />
    </div>
  );
}
