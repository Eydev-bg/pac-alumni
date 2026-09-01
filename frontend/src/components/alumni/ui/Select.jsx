import { useEffect, useId, useRef, useState } from "react";
import { HiOutlineCheck, HiOutlineChevronDown } from "react-icons/hi2";
import { cn } from "../../../utils/formatters";

/**
 * Select — accessible, mobile-safe custom dropdown replacing native <select>.
 *
 * Native selects overflow the viewport on mobile when option labels are long
 * (e.g. "Business Administration Department"). This dropdown wraps long labels,
 * stays within the trigger's width (left-0 right-0), and matches the alumni
 * blue design system (mirrors the directory FilterSelect styling).
 *
 * Props:
 *   value:       string                      — selected value; "" means none
 *   onChange:    (value: string) => void     — called with the new value
 *   options:     { value: string, label: string }[]
 *   placeholder: string (optional)           — shown when value === ""
 *   disabled:    boolean (optional)
 *   error:       boolean (optional)          — red border when true
 *   id:          string (optional)           — trigger id, to pair with <label htmlFor>
 *   ariaLabel:   string (optional)           — aria-label when there's no visible label
 *   leftIcon:    React component (optional)  — icon rendered inside the trigger, left side
 *   className:   string (optional)           — extra classes on the wrapper
 */
export default function Select({
  value = "",
  onChange,
  options = [],
  placeholder = "Select…",
  disabled = false,
  error = false,
  id,
  ariaLabel,
  leftIcon: LeftIcon,
  className,
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const wrapperRef = useRef(null);
  const triggerRef = useRef(null);
  const listboxId = useId();

  const selected = options.find((o) => o.value === value) || null;

  // ─── Close on outside click + Escape (document-level listeners) ─────
  useEffect(() => {
    if (!open) return undefined;

    const onMouseDown = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // When opening, highlight the currently selected option (or first).
  const openMenu = () => {
    if (disabled) return;
    const idx = options.findIndex((o) => o.value === value);
    setHighlight(idx >= 0 ? idx : 0);
    setOpen(true);
  };

  const closeMenu = () => setOpen(false);

  const commit = (option) => {
    onChange?.(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onTriggerKeyDown = (e) => {
    if (disabled) return;

    if (!open) {
      if (["Enter", " ", "ArrowDown"].includes(e.key)) {
        e.preventDefault();
        openMenu();
      }
      return;
    }

    // Menu is open.
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlight((h) => (h + 1) % Math.max(options.length, 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlight(
          (h) => (h - 1 + Math.max(options.length, 1)) % Math.max(options.length, 1),
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlight >= 0 && options[highlight]) commit(options[highlight]);
        break;
      case " ":
        e.preventDefault();
        if (highlight >= 0 && options[highlight]) commit(options[highlight]);
        break;
      default:
        break;
    }
  };

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      {/* ─── Trigger ─── */}
      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={onTriggerKeyDown}
        className={cn(
          "w-full appearance-none pr-8 py-2.5 bg-white dark:bg-slate-900 border rounded-xl text-sm text-left",
          "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400",
          "transition-colors motion-reduce:transition-none flex items-center gap-2",
          LeftIcon ? "pl-10" : "pl-3",
          "disabled:opacity-60 disabled:cursor-not-allowed",
          value
            ? "border-blue-300 text-slate-800 dark:text-slate-100 font-medium"
            : "border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400",
          error && "border-red-300 focus:border-red-400 focus:ring-red-500/15",
        )}
      >
        {LeftIcon && (
          <LeftIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        )}
        <span className={cn("truncate", !value && "text-slate-400")}>
          {selected ? selected.label : placeholder}
        </span>
      </button>

      {/* ─── Chevron ─── */}
      <HiOutlineChevronDown
        className={cn(
          "pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400",
          "transition-transform motion-reduce:transition-none",
          open && "rotate-180",
        )}
      />

      {/* ─── Menu ─── */}
      {open && (
        <ul
          role="listbox"
          id={listboxId}
          className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg dark:shadow-slate-900/50 py-1 z-50 max-h-64 overflow-y-auto"
        >
          {options.length === 0 && (
            <li className="px-3 py-2 text-sm text-slate-400 select-none">No options</li>
          )}
          {options.map((option, idx) => {
            const isSelected = option.value === value;
            const isHighlighted = idx === highlight;
            return (
              <li key={option.value} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => commit(option)}
                  onMouseEnter={() => setHighlight(idx)}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm flex items-start justify-between gap-2",
                    "whitespace-normal break-words min-h-[2.25rem]",
                    isSelected
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300 font-medium"
                      : isHighlighted
                        ? "bg-slate-50 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                        : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700",
                  )}
                >
                  <span>{option.label}</span>
                  {isSelected && (
                    <HiOutlineCheck className="w-4 h-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
