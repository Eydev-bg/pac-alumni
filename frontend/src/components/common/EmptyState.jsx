// ═══════════════════════════════════════════════════════════
//  FILE: frontend/src/components/common/EmptyState.jsx
//  Phase 4C — standardized empty state for the Alumni Side.
//  Icon + heading + subtext + optional CTA, on the light theme.
// ═══════════════════════════════════════════════════════════

/**
 * @param {React.ComponentType} icon    Icon component (e.g. a react-icons hi2 icon).
 * @param {string}   title    Short heading, e.g. "No announcements yet".
 * @param {string}   [message]  Supporting subtext.
 * @param {React.ReactNode} [action]  Optional CTA (button/link), rendered below.
 * @param {boolean}  [bare=false]  Render without the white card wrapper —
 *                                 for use inside an existing card container.
 */
export default function EmptyState({ icon: Icon, title, message, action, bare = false }) {
  const content = (
    <>
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center mx-auto mb-3">
          <Icon className="w-6 h-6 text-slate-300 dark:text-slate-500" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
        {title}
      </h3>
      {message && (
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          {message}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </>
  );

  if (bare) {
    return <div className="py-12 px-6 text-center">{content}</div>;
  }
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-10 text-center">
      {content}
    </div>
  );
}
