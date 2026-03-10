"use client";

import { useEffect, useRef } from "react";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
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
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) cancelRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onCancel}
    >
      <div
        className="mx-4 w-full max-w-md rounded-lg bg-surface-700 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-semibold text-foreground">{title}</h3>
        <p className="mt-2 text-foreground/60">{description}</p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 rounded-lg py-2 font-medium text-foreground transition-colors disabled:opacity-50 ${
              variant === "danger"
                ? "bg-red-600 hover:bg-red-500"
                : "bg-gold hover:bg-gold-light text-black"
            }`}
          >
            {loading ? "..." : confirmLabel}
          </button>
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="flex-1 rounded-lg bg-foreground/10 py-2 font-medium text-foreground transition-colors hover:bg-foreground/20"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
