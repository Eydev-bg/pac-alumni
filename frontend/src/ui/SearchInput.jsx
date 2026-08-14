import { useState, useEffect, useRef } from "react";
import { HiOutlineMagnifyingGlass } from "react-icons/hi2";
import { useDebounce } from "../hooks/useDebounce";
import { cn } from "../utils/formatters";

/**
 * SearchInput — list-page search field with a leading icon.
 *
 * Encapsulates the search-box + debounce + icon pattern duplicated across
 * admin list pages. Composes the existing `useDebounce` hook (not a new
 * implementation): it holds the raw text locally and emits the debounced
 * value via `onDebouncedChange`, so pages no longer wire their own debounce.
 *
 * Props:
 *   onDebouncedChange: (value: string) => void — called after `delay` ms
 *   delay:            debounce ms (default 400)
 *   defaultValue:     initial text (default "")
 */
export default function SearchInput({
  onDebouncedChange,
  delay = 400,
  defaultValue = "",
  placeholder = "Search...",
  className,
  ...rest
}) {
  const [text, setText] = useState(defaultValue);
  const debounced = useDebounce(text, delay);
  const isFirst = useRef(true);

  useEffect(() => {
    // Skip the mount call — the parent already fetches with its initial state.
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    onDebouncedChange?.(debounced);
  }, [debounced, onDebouncedChange]);

  return (
    <div className={cn("relative", className)}>
      <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400/30 transition-colors dark:bg-white/[0.06] dark:border-white/[0.08] dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:ring-gold-500/40 dark:focus:border-gold-500/30"
        {...rest}
      />
    </div>
  );
}
