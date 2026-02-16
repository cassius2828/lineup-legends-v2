"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import {
  Mail,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";

type FeedbackStatus = "new" | "read" | "resolved";

const statusTabs: { label: string; value: FeedbackStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "New", value: "new" },
  { label: "Read", value: "read" },
  { label: "Resolved", value: "resolved" },
];

export default function AdminFeedbackPage() {
  const [activeTab, setActiveTab] = useState<FeedbackStatus | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const statusFilter = activeTab === "all" ? undefined : activeTab;
  const { data: feedback, isLoading } = api.feedback.getAll.useQuery(
    statusFilter ? { status: statusFilter } : undefined,
  );

  const utils = api.useUtils();
  const updateStatus = api.feedback.updateStatus.useMutation({
    onSuccess: () => {
      void utils.feedback.getAll.invalidate();
      toast.success("Feedback status updated");
    },
    onError: () => {
      toast.error("Failed to update status");
    },
  });

  const handleStatusChange = (id: string, status: FeedbackStatus) => {
    updateStatus.mutate({ id, status });
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getStatusCounts = () => {
    if (!feedback) return { all: 0, new: 0, read: 0, resolved: 0 };
    return {
      all: feedback.length,
      new: feedback.filter((f) => f.status === "new").length,
      read: feedback.filter((f) => f.status === "read").length,
      resolved: feedback.filter((f) => f.status === "resolved").length,
    };
  };

  const counts = activeTab === "all" ? getStatusCounts() : null;

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Feedback</h1>
        <p className="mt-1 text-white/50">
          View and manage feedback submitted by users
        </p>
      </div>

      {/* Filter tabs */}
      <div className="mb-6 flex gap-2">
        {statusTabs.map((tab) => {
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                isActive
                  ? "bg-gold/15 text-gold"
                  : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70"
              }`}
            >
              {tab.label}
              {counts && tab.value !== "all" && counts[tab.value] > 0 && (
                <span
                  className={`ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs ${
                    isActive
                      ? "bg-gold/20 text-gold"
                      : tab.value === "new"
                        ? "bg-amber-400/15 text-amber-400"
                        : "bg-white/10 text-white/40"
                  }`}
                >
                  {counts[tab.value]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Feedback list */}
      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="border-t-gold h-10 w-10 animate-spin rounded-full border-4 border-white/20" />
        </div>
      ) : feedback && feedback.length > 0 ? (
        <div className="space-y-3">
          {feedback.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <div
                key={item.id}
                className="overflow-hidden rounded-xl border border-white/10 bg-white/3 transition-colors"
              >
                {/* Header row - always visible */}
                <button
                  onClick={() => toggleExpand(item.id)}
                  className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-white/2"
                >
                  <StatusIcon status={item.status} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-white">
                        {item.subject}
                      </p>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="mt-0.5 truncate text-xs text-white/40">
                      {item.name} ({item.email}) &middot;{" "}
                      {formatDistanceToNow(new Date(item.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-white/30" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-white/30" />
                  )}
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-white/10 px-4 pb-4 pt-3">
                    {/* Message */}
                    <div className="mb-4 rounded-lg bg-white/3 p-4">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/80">
                        {item.message}
                      </p>
                    </div>

                    {/* Meta info */}
                    <div className="mb-4 flex flex-wrap gap-4 text-xs text-white/40">
                      <span>From: {item.name}</span>
                      <span>Email: {item.email}</span>
                      <span>
                        Received:{" "}
                        {format(new Date(item.createdAt), "MMM d, yyyy h:mm a")}
                      </span>
                    </div>

                    {/* Status actions */}
                    <div className="flex gap-2">
                      {item.status !== "read" && (
                        <button
                          onClick={() => handleStatusChange(item.id, "read")}
                          disabled={updateStatus.isPending}
                          className="rounded-lg bg-blue-400/10 px-3 py-1.5 text-xs font-medium text-blue-400 transition-colors hover:bg-blue-400/20 disabled:opacity-50"
                        >
                          Mark as Read
                        </button>
                      )}
                      {item.status !== "resolved" && (
                        <button
                          onClick={() =>
                            handleStatusChange(item.id, "resolved")
                          }
                          disabled={updateStatus.isPending}
                          className="rounded-lg bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-400/20 disabled:opacity-50"
                        >
                          Mark as Resolved
                        </button>
                      )}
                      {item.status !== "new" && (
                        <button
                          onClick={() => handleStatusChange(item.id, "new")}
                          disabled={updateStatus.isPending}
                          className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-white/50 transition-colors hover:bg-white/10 disabled:opacity-50"
                        >
                          Reset to New
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex h-40 items-center justify-center rounded-xl border border-white/10 bg-white/3">
          <div className="text-center">
            <Mail className="mx-auto mb-2 h-8 w-8 text-white/20" />
            <p className="text-sm text-white/40">
              {activeTab === "all"
                ? "No feedback received yet"
                : `No ${activeTab} feedback`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "new":
      return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-400/10">
          <Mail className="h-4 w-4 text-amber-400" />
        </div>
      );
    case "read":
      return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-400/10">
          <Clock className="h-4 w-4 text-blue-400" />
        </div>
      );
    case "resolved":
      return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-400/10">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        </div>
      );
    default:
      return null;
  }
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    new: {
      label: "New",
      className: "bg-amber-400/15 text-amber-400",
    },
    read: {
      label: "Read",
      className: "bg-blue-400/15 text-blue-400",
    },
    resolved: {
      label: "Resolved",
      className: "bg-emerald-400/15 text-emerald-400",
    },
  };

  const { label, className } = config[status] ?? {
    label: status,
    className: "bg-white/10 text-white/60",
  };

  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}
