"use client";

import { useState, useRef, useEffect } from "react";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Ban,
  Clock,
  ChevronDown,
} from "lucide-react";

type FilterStatus = "pending" | "reviewed" | "dismissed";

export default function FlaggedContentPage() {
  const [status, setStatus] = useState<FilterStatus>("pending");
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [suspendDays, setSuspendDays] = useState(7);

  const { data, isLoading, refetch } = api.admin.getFlaggedContent.useQuery({
    status,
    limit: 30,
  });

  const reviewMutation = api.admin.reviewFlag.useMutation({
    onSuccess: () => {
      toast.success("Flag reviewed");
      void refetch();
      setReviewingId(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleAction = (
    flagId: string,
    action: "dismiss" | "warn" | "suspend" | "ban",
  ) => {
    reviewMutation.mutate({
      flagId,
      action,
      suspendDays: action === "suspend" ? suspendDays : undefined,
    });
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-foreground text-3xl font-bold">Flagged Content</h1>
        <p className="text-foreground/50 mt-1">
          Review content flagged by the profanity filter
        </p>
      </div>

      <div className="border-foreground/10 bg-surface-800 mb-6 inline-flex gap-1 rounded-lg border p-1">
        {(["pending", "reviewed", "dismissed"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={`rounded-md px-4 py-2 text-sm font-medium capitalize transition-all ${
              status === s
                ? "bg-foreground/10 text-foreground shadow-sm"
                : "text-foreground/50 hover:text-foreground/70"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="border-foreground/20 border-t-gold h-8 w-8 animate-spin rounded-full border-2" />
        </div>
      )}

      {!isLoading && data?.items.length === 0 && (
        <div className="border-foreground/10 bg-foreground/3 rounded-xl border p-12 text-center">
          <CheckCircle className="text-foreground/20 mx-auto mb-3 h-10 w-10" />
          <p className="text-foreground/50">No {status} flags</p>
        </div>
      )}

      <div className="space-y-4">
        {data?.items.map((flag) => (
          <div
            key={flag.id}
            className="border-foreground/10 bg-foreground/3 rounded-xl border p-5"
          >
            <div className="mb-3 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-amber-400/10 p-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                </div>
                <div>
                  <span className="bg-foreground/10 text-foreground/70 rounded px-2 py-0.5 text-xs font-medium capitalize">
                    {flag.contentType}
                  </span>
                  <p className="text-foreground/40 mt-1 text-xs">
                    {formatDistanceToNow(new Date(flag.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>

              {flag.user && (
                <Link
                  href={`/admin/users/${flag.user.id}`}
                  className="flex items-center gap-2 transition-opacity hover:opacity-80"
                >
                  <Image
                    src={
                      flag.user.image ??
                      flag.user.profileImg ??
                      "/default-user.jpg"
                    }
                    alt={flag.user.name}
                    width={28}
                    height={28}
                    className="rounded-full"
                  />
                  <div className="text-right">
                    <p className="text-foreground text-sm font-medium">
                      {flag.user.name}
                    </p>
                    <p className="text-foreground/40 text-xs">
                      {flag.user.email}
                    </p>
                  </div>
                </Link>
              )}
            </div>

            <div className="mb-3 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-foreground/50 mb-1 text-xs font-medium">
                  Original
                </p>
                <div className="border-foreground/10 bg-foreground/5 rounded-lg border p-3">
                  <p className="text-foreground/80 text-sm break-words whitespace-pre-wrap">
                    {flag.originalText}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-foreground/50 mb-1 text-xs font-medium">
                  Censored
                </p>
                <div className="border-foreground/10 bg-foreground/5 rounded-lg border p-3">
                  <p className="text-foreground/80 text-sm break-words whitespace-pre-wrap">
                    {flag.censoredText}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-4 flex flex-wrap gap-1.5">
              {flag.flaggedWords.map((w) => (
                <span
                  key={w}
                  className="rounded bg-red-500/10 px-2 py-0.5 text-xs text-red-400"
                >
                  {w}
                </span>
              ))}
            </div>

            {flag.status === "pending" && (
              <div className="border-foreground/10 flex flex-wrap items-center gap-2 border-t pt-3">
                <button
                  type="button"
                  onClick={() => handleAction(flag.id, "dismiss")}
                  disabled={reviewMutation.isPending}
                  className="border-foreground/20 text-foreground/70 hover:bg-foreground/5 flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={() => handleAction(flag.id, "warn")}
                  disabled={reviewMutation.isPending}
                  className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-500/20"
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Warn
                </button>
                <button
                  type="button"
                  onClick={() =>
                    reviewingId === flag.id
                      ? handleAction(flag.id, "suspend")
                      : setReviewingId(flag.id)
                  }
                  disabled={reviewMutation.isPending}
                  className="flex items-center gap-1.5 rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 text-xs font-medium text-orange-400 transition-colors hover:bg-orange-500/20"
                >
                  <Clock className="h-3.5 w-3.5" />
                  Suspend
                </button>
                {reviewingId === flag.id && (
                  <DurationPicker
                    value={suspendDays}
                    onChange={setSuspendDays}
                  />
                )}
                <button
                  type="button"
                  onClick={() => handleAction(flag.id, "ban")}
                  disabled={reviewMutation.isPending}
                  className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20"
                >
                  <Ban className="h-3.5 w-3.5" />
                  Ban
                </button>
              </div>
            )}

            {flag.status !== "pending" && (
              <div className="border-foreground/10 border-t pt-3">
                <p className="text-foreground/40 text-xs">
                  {flag.action === "none"
                    ? "Dismissed"
                    : `Action: ${flag.action}`}
                  {flag.reviewedBy && ` by ${flag.reviewedBy}`}
                  {flag.reviewedAt &&
                    ` ${formatDistanceToNow(new Date(flag.reviewedAt), { addSuffix: true })}`}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const DURATION_OPTIONS = [
  { value: 1, label: "1 day" },
  { value: 3, label: "3 days" },
  { value: 7, label: "7 days" },
  { value: 14, label: "14 days" },
  { value: 30, label: "30 days" },
  { value: 90, label: "90 days" },
];

function DurationPicker({
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
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selected = DURATION_OPTIONS.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="border-foreground/20 bg-foreground/5 text-foreground hover:bg-foreground/10 flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
      >
        {selected?.label ?? "7 days"}
        <ChevronDown
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="border-foreground/10 bg-surface-800 absolute bottom-full left-0 z-20 mb-1 w-28 overflow-hidden rounded-lg border shadow-xl">
          {DURATION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
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
