import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
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
  const menuRef = useRef(null);
  const listboxId = useId();

  // The menu is portaled to <body> so it never shares a paint layer with the
  // card it sits in — some mobile GPUs (ARM Mali) smear the content beneath an
  // absolutely-positioned overlay that lives inside the same layer. Position
  // is therefore measured off the trigger and applied as `position: fixed`.
  const [menuRect, setMenuRect] = useState(null);

  const updateMenuPosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setMenuRect({
      left: r.left,
      top: r.bottom + 4, // 4px gap, mirrors the old mt-1
      width: r.width,
      bottomSpace: window.innerHeight - r.bottom,
      topSpace: r.top,
      triggerTop: r.top,
      triggerHeight: r.height,
    });
  }, []);

  // Flip above the trigger when the menu would not fit below it.
  const flipUp =
    !!menuRect &&
    menuRect.bottomSpace < 280 &&
    menuRect.topSpace > menuRect.bottomSpace;

  const selected = options.find((o) => o.value === value) || null;

  // ─── Close on outside click + Escape (document-level listeners) ─────
  useEffect(() => {
    if (!open) return undefined;

    const onMouseDown = (e) => {
      // The menu is portaled, so it is not inside wrapperRef — check both, or a
      // click on an option would count as "outside" and close before commit.
      const insideWrapper = wrapperRef.current?.contains(e.target);
      const insideMenu = menuRef.current?.contains(e.target);
      if (!insideWrapper && !insideMenu) {
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

  // Track the trigger while the menu is open: capture-phase scroll catches
  // nested scroll containers (modal bodies, the form card), not just the window.
  useLayoutEffect(() => {
    if (!open) return undefined;
    updateMenuPosition();
    const onScroll = () => updateMenuPosition();
    const onResize = () => updateMenuPosition();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, updateMenuPosition]);

  // When opening, highlight the currently selected option (or first).
  const openMenu = () => {
    if (disabled) return;
    const idx = options.findIndex((o) => o.value === value);
    setHighlight(idx >= 0 ? idx : 0);
    updateMenuPosition();
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
      {open &&
        menuRect &&
        createPortal(
          <ul
            ref={menuRef}
            role="listbox"
            id={listboxId}
            style={{
              position: "fixed",
              left: menuRect.left,
              top: flipUp ? undefined : menuRect.top,
              bottom: flipUp
                ? window.innerHeight - menuRect.triggerTop + 4
                : undefined,
              width: menuRect.width,
            }}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg dark:shadow-none py-1 z-[95] max-h-64 overflow-y-auto"
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
                        ? "bg-blue-50 text-blue-700 dark:bg-[#223659] dark:text-blue-300 font-medium"
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
          </ul>,
          document.body,
        )}
    </div>
  );
}
