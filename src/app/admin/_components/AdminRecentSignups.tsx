import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import type { RouterOutputs } from "~/trpc/react";

type RecentUser = RouterOutputs["admin"]["getStats"]["recentUsers"][number];

type AdminRecentSignupsProps = {
  users: RecentUser[];
};

export function AdminRecentSignups({ users }: AdminRecentSignupsProps) {
  return (
    <div className="border-foreground/10 bg-foreground/3 rounded-xl border p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-foreground text-lg font-semibold">
          Recent Signups
        </h2>
        <span className="text-foreground/40 text-xs">Last 5 users</span>
      </div>
      <div className="space-y-3">
        {users.map((user) => (
          <div
            key={user.id}
            className="border-foreground/5 bg-foreground/2 flex items-center gap-3 rounded-lg border p-3"
          >
            <Image
              width={36}
              height={36}
              src={user.image ?? "/default-user.jpg"}
              alt={user.name}
              className="h-9 w-9 rounded-full"
            />
            <div className="min-w-0 flex-1">
              <p className="text-foreground truncate text-sm font-medium">
                {user.name}
              </p>
              <p className="text-foreground/40 truncate text-xs">
                {user.email}
              </p>
            </div>
            <span className="text-foreground/30 shrink-0 text-xs">
              {formatDistanceToNow(new Date(user.createdAt), {
                addSuffix: true,
              })}
            </span>
          </div>
        ))}
        {users.length === 0 && (
          <p className="text-foreground/40 py-4 text-center text-sm">
            No users yet
          </p>
        )}
      </div>
    </div>
  );
}
