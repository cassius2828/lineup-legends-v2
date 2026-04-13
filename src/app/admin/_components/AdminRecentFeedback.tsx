import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { RouterOutputs } from "~/trpc/react";
import { StatusBadge } from "../components/StatusBadge";

type RecentFeedback =
  RouterOutputs["admin"]["getStats"]["recentFeedback"][number];

type AdminRecentFeedbackProps = {
  items: RecentFeedback[];
};

export function AdminRecentFeedback({ items }: AdminRecentFeedbackProps) {
  return (
    <div className="border-foreground/10 bg-foreground/3 rounded-xl border p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-foreground text-lg font-semibold">
          Recent Feedback
        </h2>
        <Link
          href="/admin/feedback"
          className="text-gold flex items-center gap-1 text-xs hover:underline"
        >
          View all
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="space-y-3">
        {items.map((feedback) => (
          <Link
            key={feedback.id}
            href="/admin/feedback"
            className="border-foreground/5 bg-foreground/2 hover:bg-foreground/5 block rounded-lg border p-3 transition-colors"
          >
            <div className="mb-1 flex items-center justify-between">
              <p className="text-foreground truncate text-sm font-medium">
                {feedback.subject}
              </p>
              <StatusBadge status={feedback.status} />
            </div>
            <p className="text-foreground/40 truncate text-xs">
              {feedback.name} &middot;{" "}
              {formatDistanceToNow(new Date(feedback.createdAt), {
                addSuffix: true,
              })}
            </p>
          </Link>
        ))}
        {items.length === 0 && (
          <p className="text-foreground/40 py-4 text-center text-sm">
            No feedback yet
          </p>
        )}
      </div>
    </div>
  );
}
