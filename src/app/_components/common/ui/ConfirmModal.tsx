"use client";

import BaseModal from "./BaseModal";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const confirmClasses =
    variant === "danger"
      ? "bg-red-600 hover:bg-red-500 text-white"
      : "bg-gold hover:bg-gold-light text-black";

  return (
    <BaseModal open={open} onClose={onCancel}>
      <h3 className="text-foreground text-base font-semibold">{title}</h3>
      {description && (
        <p className="text-foreground/50 mt-2 text-sm leading-relaxed">
          {description}
        </p>
      )}
      <div className="mt-5 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="text-foreground/60 hover:bg-foreground/10 hover:text-foreground rounded-full px-4 py-1.5 text-sm font-medium transition-colors disabled:opacity-40"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={`rounded-full px-5 py-1.5 text-sm font-semibold transition-colors disabled:opacity-40 ${confirmClasses}`}
        >
          {loading ? "Deleting..." : confirmLabel}
        </button>
      </div>
    </BaseModal>
  );
}
