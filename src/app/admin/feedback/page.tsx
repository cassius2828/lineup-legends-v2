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
import { Button } from "~/app/_components/common/ui/Button";
import { StatusBadge } from "../components/StatusBadge";
import { AdminSpinner } from "../components/shared";
import { AdminPageHeader } from "../_components/AdminPageHeader";

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
      <AdminPageHeader
        title="Feedback"
        description="View and manage feedback submitted by users"
      />

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
                  : "bg-foreground/5 text-foreground/50 hover:bg-foreground/10 hover:text-foreground/70"
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
                        : "bg-foreground/10 text-foreground/40"
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
        <AdminSpinner />
      ) : feedback && feedback.length > 0 ? (
        <div className="space-y-3">
          {feedback.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <div
                key={item.id}
                className="border-foreground/10 bg-foreground/3 overflow-hidden rounded-xl border transition-colors"
              >
                {/* Header row - always visible */}
                <button
                  onClick={() => toggleExpand(item.id)}
                  className="hover:bg-foreground/2 flex w-full items-center gap-4 p-4 text-left transition-colors"
                >
                  <StatusIcon status={item.status} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-foreground truncate text-sm font-medium">
                        {item.subject}
                      </p>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="text-foreground/40 mt-0.5 truncate text-xs">
                      {item.name} ({item.email}) &middot;{" "}
                      {formatDistanceToNow(new Date(item.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="text-foreground/30 h-4 w-4 shrink-0" />
                  ) : (
                    <ChevronDown className="text-foreground/30 h-4 w-4 shrink-0" />
                  )}
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-foreground/10 border-t px-4 pt-3 pb-4">
                    {/* Message */}
                    <div className="bg-foreground/3 mb-4 rounded-lg p-4">
                      <p className="text-foreground/80 text-sm leading-relaxed whitespace-pre-wrap">
                        {item.message}
                      </p>
                    </div>

                    {/* Meta info */}
                    <div className="text-foreground/40 mb-4 flex flex-wrap gap-4 text-xs">
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
                        <Button
                          onClick={() => handleStatusChange(item.id, "read")}
                          disabled={updateStatus.isPending}
                          color="blue"
                          variant="subtle"
                        >
                          Mark as Read
                        </Button>
                      )}
                      {item.status !== "resolved" && (
                        <Button
                          onClick={() =>
                            handleStatusChange(item.id, "resolved")
                          }
                          disabled={updateStatus.isPending}
                          color="gold"
                          variant="subtle"
                        >
                          Mark as Resolved
                        </Button>
                      )}
                      {item.status !== "new" && (
                        <Button
                          onClick={() => handleStatusChange(item.id, "new")}
                          disabled={updateStatus.isPending}
                          color="white"
                          variant="subtle"
                        >
                          Reset to New
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="border-foreground/10 bg-foreground/3 flex h-40 items-center justify-center rounded-xl border">
          <div className="text-center">
            <Mail className="text-foreground/20 mx-auto mb-2 h-8 w-8" />
            <p className="text-foreground/40 text-sm">
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
        <div className="bg-gold-300/10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
          <CheckCircle2 className="text-gold-300 h-4 w-4" />
        </div>
      );
    default:
      return null;
  }
}
