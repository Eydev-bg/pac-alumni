import { Link } from "react-router-dom";
import { cn } from "../../../utils/formatters";

/**
 * SectionHeader — a card/section title with an optional right-aligned action.
 * Matches the "Title … View All" rows across the redesign.
 *
 * Props:
 *   title:       string | node (required)
 *   actionLabel: string — text for the trailing link (e.g. "View All")
 *   actionTo:    string — react-router path for the action link
 *   action:      node — custom trailing content (overrides actionLabel/actionTo)
 */
export default function SectionHeader({
  title,
  actionLabel,
  actionTo,
  action,
  className,
  ...rest
}) {
  return (
    <div
      className={cn("flex items-center justify-between gap-3 mb-4", className)}
      {...rest}
    >
      {typeof title === "string" ? (
        <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      ) : (
        title
      )}
      {action
        ? action
        : actionLabel &&
          actionTo && (
            <Link
              to={actionTo}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              {actionLabel}
            </Link>
          )}
    </div>
  );
}
