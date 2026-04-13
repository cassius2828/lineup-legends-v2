"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import { Ban, Clock, ChevronDown } from "lucide-react";
import { Spinner } from "~/app/_components/common/loaders";

// ─── Constants ────────────────────────────────────────────────────────────────

export const SUSPEND_DURATION_OPTIONS = [
  { value: 1, label: "1 day" },
  { value: 3, label: "3 days" },
  { value: 7, label: "7 days" },
  { value: 14, label: "14 days" },
  { value: 30, label: "30 days" },
  { value: 90, label: "90 days" },
] as const;

// ─── Filter Tabs ──────────────────────────────────────────────────────────────

export function AdminFilterTabs<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div
      role="tablist"
      className="border-foreground/10 bg-surface-800 inline-flex gap-1 rounded-lg border p-1"
    >
      {options.map((opt) => (
        <button
          key={opt}
          role="tab"
          type="button"
          aria-selected={value === opt}
          onClick={() => onChange(opt)}
          className={`rounded-md px-4 py-2 text-sm font-medium capitalize transition-all ${
            value === opt
              ? "bg-foreground/10 text-foreground shadow-sm"
              : "text-foreground/50 hover:text-foreground/70"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

export function AdminSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <Spinner size="md" />
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

export function AdminEmptyState({
  icon,
  message,
}: {
  icon: ReactNode;
  message: string;
}) {
  return (
    <div className="border-foreground/10 bg-foreground/3 rounded-xl border p-12 text-center">
      <div className="text-foreground/20 mx-auto mb-3 [&>svg]:h-10 [&>svg]:w-10">
        {icon}
      </div>
      <p className="text-foreground/50">{message}</p>
    </div>
  );
}

// ─── Error State ──────────────────────────────────────────────────────────────

export function AdminErrorState({
  message = "Something went wrong",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="border-foreground/10 bg-foreground/3 rounded-xl border p-12 text-center">
      <p className="text-foreground/50 mb-3">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="text-gold hover:text-gold-light text-sm font-medium transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
}

// ─── Duration Picker ──────────────────────────────────────────────────────────

export function DurationPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const selected = SUSPEND_DURATION_OPTIONS.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="border-foreground/20 bg-foreground/5 text-foreground hover:bg-foreground/10 flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
      >
        {selected?.label ?? "7 days"}
        <ChevronDown
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div
          role="listbox"
          className="border-foreground/10 bg-surface-800 absolute bottom-full left-0 z-20 mb-1 w-28 overflow-hidden rounded-lg border shadow-xl"
        >
          {SUSPEND_DURATION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              role="option"
              type="button"
              aria-selected={opt.value === value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full px-3 py-2 text-left text-xs font-medium transition-colors ${
                opt.value === value
                  ? "bg-gold/15 text-gold"
                  : "text-foreground/70 hover:bg-foreground/10 hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Status Badges ────────────────────────────────────────────────────────────

export function UserStatusBadges({
  banned,
  suspendedUntil,
}: {
  banned?: boolean;
  suspendedUntil?: string | Date | null;
}) {
  if (banned) {
    return (
      <span className="flex items-center gap-1 rounded bg-red-500/10 px-2 py-0.5 text-xs text-red-400">
        <Ban className="h-3 w-3" />
        Banned
      </span>
    );
  }

  if (suspendedUntil && new Date(suspendedUntil) > new Date()) {
    return (
      <span className="flex items-center gap-1 rounded bg-orange-500/10 px-2 py-0.5 text-xs text-orange-400">
        <Clock className="h-3 w-3" />
        Suspended
      </span>
    );
  }

  return null;
}
