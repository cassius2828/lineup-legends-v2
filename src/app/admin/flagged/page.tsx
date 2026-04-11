"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, CheckCircle, XCircle, Ban, Clock } from "lucide-react";
import { Button } from "~/app/_components/ui/Button";
import {
  AdminFilterTabs,
  AdminSpinner,
  AdminEmptyState,
  AdminErrorState,
  DurationPicker,
} from "../components/shared";

type FilterStatus = "pending" | "reviewed" | "dismissed";

export default function FlaggedContentPage() {
  const [status, setStatus] = useState<FilterStatus>("pending");
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [suspendDays, setSuspendDays] = useState(7);

  const { data, isLoading, isError, refetch } =
    api.admin.getFlaggedContent.useQuery({
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

      <div className="mb-6">
        <AdminFilterTabs
          options={["pending", "reviewed", "dismissed"] as const}
          value={status}
          onChange={setStatus}
        />
      </div>

      {isLoading && <AdminSpinner />}

      {isError && (
        <AdminErrorState
          message="Failed to load flagged content"
          onRetry={() => void refetch()}
        />
      )}

      {!isLoading && !isError && data?.items.length === 0 && (
        <AdminEmptyState
          icon={<CheckCircle />}
          message={`No ${status} flags`}
        />
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
                <Button
                  onClick={() => handleAction(flag.id, "dismiss")}
                  disabled={reviewMutation.isPending}
                  color="white"
                  variant="subtle"
                >
                  <span className="flex items-center gap-1.5">
                    <XCircle className="h-3.5 w-3.5" />
                    Dismiss
                  </span>
                </Button>
                <Button
                  onClick={() => handleAction(flag.id, "warn")}
                  disabled={reviewMutation.isPending}
                  color="orange"
                  variant="subtle"
                >
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Warn
                  </span>
                </Button>
                <Button
                  onClick={() =>
                    reviewingId === flag.id
                      ? handleAction(flag.id, "suspend")
                      : setReviewingId(flag.id)
                  }
                  disabled={reviewMutation.isPending}
                  color="orange"
                  variant="subtle"
                >
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Suspend
                  </span>
                </Button>
                {reviewingId === flag.id && (
                  <DurationPicker
                    value={suspendDays}
                    onChange={setSuspendDays}
                  />
                )}
                <Button
                  onClick={() => handleAction(flag.id, "ban")}
                  disabled={reviewMutation.isPending}
                  color="red"
                  variant="subtle"
                >
                  <span className="flex items-center gap-1.5">
                    <Ban className="h-3.5 w-3.5" />
                    Ban
                  </span>
                </Button>
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
