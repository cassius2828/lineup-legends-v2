"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ChevronDown, ChevronRight } from "lucide-react";
import { api } from "~/trpc/react";
import { AdminPageHeader } from "~/app/admin/_components/AdminPageHeader";
import { AdminSpinner } from "~/app/admin/components/shared";
import { Button } from "~/app/_components/common/ui/Button";

type AuditEntry = {
  id: string;
  playerId: string;
  action: "create" | "update" | "delete";
  performedByEmail: string;
  before: {
    firstName: string;
    lastName: string;
    value: number;
    imgUrl: string;
  } | null;
  after: {
    firstName: string;
    lastName: string;
    value: number;
    imgUrl: string;
  } | null;
  timestamp: string;
};

const ACTION_STYLES: Record<string, string> = {
  create: "bg-green-500/20 text-green-400",
  update: "bg-amber-500/20 text-amber-400",
  delete: "bg-red-500/20 text-red-400",
};

function FieldDiff({
  label,
  before,
  after,
}: {
  label: string;
  before: string | number | undefined;
  after: string | number | undefined;
}) {
  const changed = String(before) !== String(after);
  if (!changed) return null;
  return (
    <div className="text-sm">
      <span className="text-foreground/50 font-medium">{label}: </span>
      <span className="text-red-400 line-through">{String(before)}</span>
      <span className="text-foreground/40 mx-1">→</span>
      <span className="text-green-400">{String(after)}</span>
    </div>
  );
}

function AuditRow({ entry }: { entry: AuditEntry }) {
  const [expanded, setExpanded] = useState(false);

  const playerName = entry.after
    ? `${entry.after.firstName} ${entry.after.lastName}`
    : entry.before
      ? `${entry.before.firstName} ${entry.before.lastName}`
      : "Unknown";

  return (
    <div className="border-foreground/10 border-b last:border-b-0">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="hover:bg-foreground/5 flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors"
      >
        {expanded ? (
          <ChevronDown className="text-foreground/40 h-4 w-4 shrink-0" />
        ) : (
          <ChevronRight className="text-foreground/40 h-4 w-4 shrink-0" />
        )}

        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${ACTION_STYLES[entry.action] ?? ""}`}
        >
          {entry.action}
        </span>

        <span className="text-foreground min-w-0 flex-1 truncate font-medium">
          {playerName}
        </span>

        <span className="text-foreground/50 shrink-0 text-xs">
          {entry.performedByEmail}
        </span>

        <span className="text-foreground/40 w-28 shrink-0 text-right text-xs">
          {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
        </span>
      </button>

      {expanded && (
        <div className="bg-foreground/5 space-y-1 px-11 py-3">
          {entry.action === "create" && entry.after && (
            <div className="text-sm">
              <span className="text-foreground/50">Created: </span>
              <span className="text-foreground">
                {entry.after.firstName} {entry.after.lastName} — $
                {entry.after.value}
              </span>
            </div>
          )}
          {entry.action === "delete" && entry.before && (
            <div className="text-sm">
              <span className="text-foreground/50">Deleted: </span>
              <span className="text-foreground">
                {entry.before.firstName} {entry.before.lastName} — $
                {entry.before.value}
              </span>
            </div>
          )}
          {entry.action === "update" && entry.before && entry.after && (
            <>
              <FieldDiff
                label="Name"
                before={`${entry.before.firstName} ${entry.before.lastName}`}
                after={`${entry.after.firstName} ${entry.after.lastName}`}
              />
              <FieldDiff
                label="Value"
                before={entry.before.value}
                after={entry.after.value}
              />
              <FieldDiff
                label="Image"
                before={entry.before.imgUrl}
                after={entry.after.imgUrl}
              />
              {entry.before.firstName === entry.after.firstName &&
                entry.before.lastName === entry.after.lastName &&
                entry.before.value === entry.after.value &&
                entry.before.imgUrl === entry.after.imgUrl && (
                  <p className="text-foreground/40 text-sm italic">
                    No field changes detected
                  </p>
                )}
            </>
          )}
          <p className="text-foreground/30 pt-1 text-xs">
            {new Date(entry.timestamp).toLocaleString()} • Player ID:{" "}
            {entry.playerId}
          </p>
        </div>
      )}
    </div>
  );
}

export default function AuditLogPage() {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    api.player.auditLog.useInfiniteQuery(
      { limit: 50 },
      {
        getNextPageParam: (lastPage) => lastPage.cursor ?? undefined,
      },
    );

  const entries = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div>
      <AdminPageHeader
        title="Player Audit Log"
        description="History of all player creates, edits, and deletions"
      />

      {isLoading ? (
        <AdminSpinner />
      ) : entries.length === 0 ? (
        <div className="bg-foreground/5 rounded-xl p-12 text-center">
          <p className="text-foreground/60">No audit entries yet</p>
        </div>
      ) : (
        <>
          <div className="border-foreground/10 overflow-hidden rounded-xl border">
            {entries.map((entry) => (
              <AuditRow key={entry.id} entry={entry} />
            ))}
          </div>
          {hasNextPage && (
            <div className="mt-4 flex justify-center">
              <Button
                handleClick={() => void fetchNextPage()}
                disabled={isFetchingNextPage}
                color="white"
                variant="subtle"
              >
                {isFetchingNextPage ? "Loading..." : "Load more"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
