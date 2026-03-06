"use client";

import Link from "next/link";
import { api } from "~/trpc/react";
import {
  Users,
  Layers,
  Star,
  MessageSquare,
  UserPlus,
  TrendingUp,
  Plus,
  ArrowRight,
  Mail,
  ImageOff,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = api.admin.getStats.useQuery();

  if (isLoading || !stats) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="border-t-gold h-12 w-12 animate-spin rounded-full border-4 border-foreground/20" />
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Users",
      value: stats.totalUsers,
      subtitle: `+${stats.newUsersWeek} this week`,
      icon: Users,
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
    },
    {
      label: "Total Lineups",
      value: stats.totalLineups,
      icon: Layers,
      color: "text-gold-300",
      bgColor: "bg-gold-300/10",
    },
    {
      label: "Total Players",
      value: stats.totalPlayers,
      icon: Star,
      color: "text-gold",
      bgColor: "bg-gold/10",
    },
    {
      label: "Total Ratings",
      value: stats.totalRatings,
      icon: TrendingUp,
      color: "text-purple-400",
      bgColor: "bg-purple-400/10",
    },
    {
      label: "Pending Feedback",
      value: stats.pendingFeedback,
      subtitle: `${stats.totalFeedback} total`,
      icon: MessageSquare,
      color: stats.pendingFeedback > 0 ? "text-amber-400" : "text-foreground/60",
      bgColor:
        stats.pendingFeedback > 0 ? "bg-amber-400/10" : "bg-foreground/5",
      highlight: stats.pendingFeedback > 0,
    },
    {
      label: "Requested Players",
      value: stats.totalRequestedPlayers,
      icon: UserPlus,
      color: "text-rose-400",
      bgColor: "bg-rose-400/10",
    },
  ];

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-foreground/50">
          Overview of Lineup Legends activity and stats
        </p>
      </div>

      {/* Stats grid */}
      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`relative overflow-hidden rounded-xl border p-5 transition-colors ${
              card.highlight
                ? "border-amber-400/30 bg-amber-400/5"
                : "border-foreground/10 bg-foreground/3"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-foreground/50">{card.label}</p>
                <p className="mt-1 text-3xl font-bold text-foreground">
                  {card.value.toLocaleString()}
                </p>
                {card.subtitle && (
                  <p className="mt-1 text-xs text-foreground/40">{card.subtitle}</p>
                )}
              </div>
              <div className={`rounded-lg p-2.5 ${card.bgColor}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Two-column layout for recent activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent signups */}
        <div className="rounded-xl border border-foreground/10 bg-foreground/3 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Recent Signups
            </h2>
            <span className="text-xs text-foreground/40">Last 5 users</span>
          </div>
          <div className="space-y-3">
            {stats.recentUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 rounded-lg border border-foreground/5 bg-foreground/2 p-3"
              >
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.name}
                    className="h-9 w-9 rounded-full"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground/10">
                    <span className="text-sm font-medium text-foreground/50">
                      {user.name.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {user.name}
                  </p>
                  <p className="truncate text-xs text-foreground/40">{user.email}</p>
                </div>
                <span className="shrink-0 text-xs text-foreground/30">
                  {formatDistanceToNow(new Date(user.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            ))}
            {stats.recentUsers.length === 0 && (
              <p className="py-4 text-center text-sm text-foreground/40">
                No users yet
              </p>
            )}
          </div>
        </div>

        {/* Recent feedback */}
        <div className="rounded-xl border border-foreground/10 bg-foreground/3 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
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
            {stats.recentFeedback.map((feedback) => (
              <Link
                key={feedback.id}
                href="/admin/feedback"
                className="block rounded-lg border border-foreground/5 bg-foreground/2 p-3 transition-colors hover:bg-foreground/5"
              >
                <div className="mb-1 flex items-center justify-between">
                  <p className="truncate text-sm font-medium text-foreground">
                    {feedback.subject}
                  </p>
                  <StatusBadge status={feedback.status} />
                </div>
                <p className="truncate text-xs text-foreground/40">
                  {feedback.name} &middot;{" "}
                  {formatDistanceToNow(new Date(feedback.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </Link>
            ))}
            {stats.recentFeedback.length === 0 && (
              <p className="py-4 text-center text-sm text-foreground/40">
                No feedback yet
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Link
            href="/admin/add-player"
            className="flex items-center gap-3 rounded-xl border border-foreground/10 bg-foreground/3 p-4 transition-colors hover:bg-foreground/6"
          >
            <div className="rounded-lg bg-gold-300/10 p-2">
              <Plus className="h-5 w-5 text-gold-300" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Add Player</p>
              <p className="text-xs text-foreground/40">Add a new player to the database</p>
            </div>
          </Link>
          <Link
            href="/admin/requested"
            className="flex items-center gap-3 rounded-xl border border-foreground/10 bg-foreground/3 p-4 transition-colors hover:bg-foreground/6"
          >
            <div className="rounded-lg bg-rose-400/10 p-2">
              <UserPlus className="h-5 w-5 text-rose-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Requested Players
              </p>
              <p className="text-xs text-foreground/40">
                Review player requests from users
              </p>
            </div>
          </Link>
          <Link
            href="/admin/feedback"
            className="flex items-center gap-3 rounded-xl border border-foreground/10 bg-foreground/3 p-4 transition-colors hover:bg-foreground/6"
          >
            <div className="rounded-lg bg-amber-400/10 p-2">
              <Mail className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Feedback</p>
              <p className="text-xs text-foreground/40">
                Manage user feedback and messages
              </p>
            </div>
          </Link>
          <Link
            href="/test/player-images"
            className="flex items-center gap-3 rounded-xl border border-foreground/10 bg-foreground/3 p-4 transition-colors hover:bg-foreground/6"
          >
            <div className="rounded-lg bg-red-400/10 p-2">
              <ImageOff className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Test Player Images</p>
              <p className="text-xs text-foreground/40">
                Check for broken player images
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
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
      className: "bg-gold-300/15 text-gold-300",
    },
  };

  const { label, className } = config[status] ?? {
    label: status,
    className: "bg-foreground/10 text-foreground/60",
  };

  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}
