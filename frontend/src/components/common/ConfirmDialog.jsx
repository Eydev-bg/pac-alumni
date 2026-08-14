import { useRef } from "react";
import { HiOutlineExclamationTriangle } from "react-icons/hi2";
import Modal from "../../ui/Modal";
import Button from "../../ui/Button";

/**
 * ConfirmDialog — modal for destructive actions.
 *
 * Composes the shared accessible Modal (backdrop, scroll-lock, ESC, focus
 * trap + restore) and shared Button. Public props are unchanged.
 *
 * Usage:
 *   <ConfirmDialog
 *     open={showConfirm}
 *     title="Suspend User"
 *     message="Are you sure? The user will lose access immediately."
 *     confirmLabel="Suspend"
 *     variant="danger"
 *     onConfirm={() => handleSuspend()}
 *     onCancel={() => setShowConfirm(false)}
 *   />
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger", // 'danger' | 'warning' | 'info'
  loading = false,
  onConfirm,
  onCancel,
}) {
  const cancelRef = useRef(null);

  // Map the confirm intent onto the shared Button variants.
  const confirmVariant = variant === "info" ? "primary" : "danger";

  return (
    <Modal
      open={open}
      onClose={onCancel}
      size="sm"
      initialFocusRef={cancelRef}
      closeOnBackdrop={!loading}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-50 flex items-center justify-center dark:bg-red-500/15">
          <HiOutlineExclamationTriangle className="w-5 h-5 text-red-500 dark:text-red-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            {title}
          </h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {message}
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <Button
          ref={cancelRef}
          variant="secondary"
          size="md"
          onClick={onCancel}
          disabled={loading}
        >
          {cancelLabel}
        </Button>
        <Button
          variant={confirmVariant}
          size="md"
          onClick={onConfirm}
          loading={loading}
        >
          {loading ? "Processing..." : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
