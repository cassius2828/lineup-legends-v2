"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Ban,
  Shield,
  AlertTriangle,
  Unlock,
  Globe,
  MessageSquare,
} from "lucide-react";
import { AdminSpinner, UserStatusBadges } from "../../components/shared";

export default function UserDetailPage() {
  const params = useParams<{ userId: string }>();
  const router = useRouter();
  const [showBanForm, setShowBanForm] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [suspendDays, setSuspendDays] = useState<number | null>(null);

  const {
    data: user,
    isLoading,
    refetch,
  } = api.admin.getUserDetail.useQuery({
    userId: params.userId,
  });

  const banMutation = api.admin.banUser.useMutation({
    onSuccess: () => {
      toast.success(suspendDays ? "User suspended" : "User banned");
      void refetch();
      setShowBanForm(false);
      setBanReason("");
      setSuspendDays(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const unbanMutation = api.admin.unbanUser.useMutation({
    onSuccess: () => {
      toast.success("User unbanned");
      void refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleBan = () => {
    if (!banReason.trim()) {
      toast.error("Please provide a reason");
      return;
    }
    banMutation.mutate({
      userId: params.userId,
      reason: banReason.trim(),
      suspendDays: suspendDays ?? undefined,
    });
  };

  if (isLoading) {
    return <AdminSpinner />;
  }

  if (!user) {
    return (
      <div className="py-20 text-center">
        <p className="text-foreground/50">User not found</p>
      </div>
    );
  }

  const isBanned = user.banned;
  const isSuspended =
    !user.banned &&
    user.suspendedUntil &&
    new Date(user.suspendedUntil) > new Date();

  return (
    <div>
      <button
        type="button"
        onClick={() => router.push("/admin/users")}
        className="text-foreground/50 hover:text-foreground mb-6 flex items-center gap-2 text-sm transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Users
      </button>

      <div className="border-foreground/10 bg-foreground/3 mb-6 rounded-xl border p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <Image
            src={user.image ?? user.profileImg ?? "/default-user.jpg"}
            alt={user.name}
            width={64}
            height={64}
            className="rounded-full"
          />
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <h1 className="text-foreground text-2xl font-bold">
                {user.name}
              </h1>
              {user.admin && <Shield className="text-gold h-5 w-5" />}
              <UserStatusBadges
                banned={user.banned}
                suspendedUntil={user.suspendedUntil}
              />
            </div>
            <p className="text-foreground/50 text-sm">
              {user.username && `@${user.username} · `}
              {user.email}
            </p>
            {user.bio && (
              <p className="text-foreground/60 mt-2 text-sm">{user.bio}</p>
            )}
          </div>
        </div>

        <div className="border-foreground/10 mt-4 grid grid-cols-2 gap-4 border-t pt-4 sm:grid-cols-5">
          <Stat label="Followers" value={user.followerCount} />
          <Stat label="Following" value={user.followingCount} />
          <Stat label="Content Flags" value={user.flagCount} />
          <Stat label="Suspensions" value={user.suspensionCount ?? 0} />
          <Stat
            label="Joined"
            value={formatDistanceToNow(new Date(user.createdAt), {
              addSuffix: true,
            })}
          />
        </div>

        <div className="border-foreground/10 mt-4 grid grid-cols-1 gap-4 border-t pt-4 sm:grid-cols-2">
          <div className="flex items-center gap-2">
            <Globe className="text-foreground/40 h-4 w-4" />
            <span className="text-foreground/50 text-xs">Registration IP:</span>
            <span className="text-foreground/70 font-mono text-xs">
              {user.registrationIp ?? "N/A"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="text-foreground/40 h-4 w-4" />
            <span className="text-foreground/50 text-xs">Last Login IP:</span>
            <span className="text-foreground/70 font-mono text-xs">
              {user.lastLoginIp ?? "N/A"}
            </span>
          </div>
        </div>

        {user.banReason && (
          <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/5 p-3">
            <p className="text-xs font-medium text-red-400">Ban Reason</p>
            <p className="text-foreground/70 mt-1 text-sm">{user.banReason}</p>
          </div>
        )}
      </div>

      {!user.admin && (
        <div className="border-foreground/10 bg-foreground/3 mb-6 rounded-xl border p-6">
          <h2 className="text-foreground mb-4 text-lg font-semibold">
            Actions
          </h2>
          <div className="flex flex-wrap gap-3">
            {(isBanned || isSuspended) && (
              <button
                type="button"
                onClick={() => unbanMutation.mutate({ userId: params.userId })}
                disabled={unbanMutation.isPending}
                className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm font-medium text-green-400 transition-colors hover:bg-green-500/20"
              >
                <Unlock className="h-4 w-4" />
                Unban / Unsuspend
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowBanForm(!showBanForm)}
              className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20"
            >
              <Ban className="h-4 w-4" />
              {showBanForm ? "Cancel" : "Ban / Suspend"}
            </button>
          </div>

          {showBanForm && (
            <div className="border-foreground/10 mt-4 space-y-4 border-t pt-4">
              <div>
                <label
                  htmlFor="ban-reason"
                  className="text-foreground/70 mb-1 block text-sm font-medium"
                >
                  Reason
                </label>
                <input
                  id="ban-reason"
                  type="text"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Reason for ban or suspension..."
                  className="border-foreground/10 bg-foreground/5 text-foreground placeholder-foreground/40 focus:border-gold w-full rounded-lg border px-3 py-2 text-sm focus:ring-1 focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="suspend-duration"
                  className="text-foreground/70 mb-1 block text-sm font-medium"
                >
                  Duration (leave empty for permanent ban)
                </label>
                <select
                  id="suspend-duration"
                  value={suspendDays ?? ""}
                  onChange={(e) =>
                    setSuspendDays(
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                  className="border-foreground/10 bg-foreground/5 text-foreground rounded-lg border px-3 py-2 text-sm"
                >
                  <option value="">Permanent Ban</option>
                  <option value="1">Suspend 1 day</option>
                  <option value="3">Suspend 3 days</option>
                  <option value="7">Suspend 7 days</option>
                  <option value="14">Suspend 14 days</option>
                  <option value="30">Suspend 30 days</option>
                  <option value="90">Suspend 90 days</option>
                  <option value="365">Suspend 1 year</option>
                </select>
              </div>
              <button
                type="button"
                onClick={handleBan}
                disabled={banMutation.isPending || !banReason.trim()}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {banMutation.isPending
                  ? "Processing..."
                  : suspendDays
                    ? `Suspend for ${suspendDays} days`
                    : "Permanently Ban"}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="border-foreground/10 bg-foreground/3 mb-6 rounded-xl border p-6">
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle className="text-foreground/50 h-5 w-5" />
          <h2 className="text-foreground text-lg font-semibold">
            Content Flags ({user.flagCount})
          </h2>
        </div>
        {user.flagCount === 0 ? (
          <p className="text-foreground/40 text-sm">
            No content flags for this user
          </p>
        ) : (
          <Link
            href={`/admin/flagged`}
            className="text-gold hover:text-gold/80 text-sm transition-colors"
          >
            View all flags →
          </Link>
        )}
      </div>

      <div className="border-foreground/10 bg-foreground/3 rounded-xl border p-6">
        <div className="mb-4 flex items-center gap-2">
          <MessageSquare className="text-foreground/50 h-5 w-5" />
          <h2 className="text-foreground text-lg font-semibold">
            Recent Comments
          </h2>
        </div>
        {user.recentComments.length === 0 ? (
          <p className="text-foreground/40 text-sm">No comments yet</p>
        ) : (
          <div className="space-y-3">
            {user.recentComments.map((c) => (
              <div
                key={c.id}
                className="border-foreground/10 rounded-lg border p-3"
              >
                <p className="text-foreground/80 text-sm">{c.text}</p>
                <div className="mt-2 flex items-center gap-3">
                  <Link
                    href={`/lineups/${c.lineupId}`}
                    className="text-gold text-xs hover:underline"
                  >
                    View Lineup
                  </Link>
                  {c.createdAt && (
                    <span className="text-foreground/30 text-xs">
                      {formatDistanceToNow(new Date(c.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <p className="text-foreground/40 text-xs">{label}</p>
      <p className="text-foreground text-lg font-semibold">{value}</p>
    </div>
  );
}
