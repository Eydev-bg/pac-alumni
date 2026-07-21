import { useState } from "react";
import { cn, storageUrl } from "../../../utils/formatters";

/**
 * Avatar — circular user image with an initials fallback. Reused across the
 * header, welcome card, and messages. Pass the raw stored path as `src`; it is
 * resolved through `storageUrl` so callers don't repeat that. Falls back to
 * initials (derived from `name`) when there is no image or it fails to load.
 *
 * Props:
 *   src:  raw profile-picture path (or absolute URL), optional
 *   name: full name — drives initials + alt text
 *   size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' (default 'md')
 */
const SIZES = {
  xs: "w-7 h-7 text-[10px]",
  sm: "w-9 h-9 text-xs",
  md: "w-11 h-11 text-sm",
  lg: "w-14 h-14 text-base",
  xl: "w-20 h-20 text-xl",
};

function initials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "?";
}

export default function Avatar({ src, name, size = "md", className, ...rest }) {
  const [failed, setFailed] = useState(false);
  const url = failed ? null : storageUrl(src);
  const dim = SIZES[size] || SIZES.md;

  return url ? (
    <img
      src={url}
      alt={name || "Avatar"}
      onError={() => setFailed(true)}
      className={cn("rounded-full object-cover flex-shrink-0", dim, className)}
      {...rest}
    />
  ) : (
    <span
      aria-label={name || "Avatar"}
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold flex-shrink-0 bg-blue-100 text-blue-700",
        dim,
        className,
      )}
      {...rest}
    >
      {initials(name)}
    </span>
  );
}
