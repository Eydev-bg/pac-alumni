import { cn } from "../../utils/formatters";

/**
 * SettingsSection — titled card wrapper for an alumni settings block.
 *
 * The alumni counterpart to `components/alumni/ui/AlumniCard`, adding a
 * title + optional description header. Carries dark: variants so it reads
 * correctly under the alumni dark theme.
 *
 * Props:
 *   title:       section heading (string)
 *   description: optional sub-text under the title
 *   children:    section body
 */
export default function SettingsSection({
  title,
  description,
  className,
  children,
}) {
  return (
    <section
      className={cn(
        "bg-white rounded-xl border border-slate-200/80 shadow-sm",
        "dark:bg-slate-800 dark:border-slate-700",
        className,
      )}
    >
      {(title || description) && (
        <header className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          {title && (
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
              {title}
            </h2>
          )}
          {description && (
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              {description}
            </p>
          )}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}
