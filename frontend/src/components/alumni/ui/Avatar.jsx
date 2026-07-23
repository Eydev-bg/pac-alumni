import { useState } from "react";
import { HiOutlineUser } from "react-icons/hi2";
import { cn, storageUrl } from "../../../utils/formatters";

/**
 * Avatar — circular user image with a neutral person-icon fallback. Reused
 * across the header, welcome card, and messages. Pass the raw stored path as
 * `src`; it is resolved through `storageUrl` so callers don't repeat that.
 * Falls back to a neutral person icon when there is no image or it fails to
 * load.
 *
 * Props:
 *   src:  raw profile-picture path (or absolute URL), optional
 *   name: full name — drives alt / aria-label text
 *   size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' (default 'md')
 */
const SIZES = {
  xs: "w-7 h-7 text-[10px]",
  sm: "w-9 h-9 text-xs",
  md: "w-11 h-11 text-sm",
  lg: "w-14 h-14 text-base",
  xl: "w-20 h-20 text-xl",
};

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
        "inline-flex items-center justify-center rounded-full flex-shrink-0 bg-slate-100 text-slate-400",
        dim,
        className,
      )}
      {...rest}
    >
      <HiOutlineUser className="w-1/2 h-1/2" aria-hidden="true" />
    </span>
  );
}
