"use client";

import Image from "next/image";
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
  Sparkles,
  AlertTriangle,
  Shield,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { StatusBadge } from "./components/StatusBadge";

export default function AdminDashboardPage() {
  const {
    data: stats,
    isLoading,
    isError,
    refetch,
  } = api.admin.getStats.useQuery();

  if (isLoading || !stats) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="border-t-gold border-foreground/20 h-12 w-12 animate-spin rounded-full border-4" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="border-foreground/10 bg-foreground/3 mx-auto mt-20 max-w-md rounded-xl border p-12 text-center">
        <p className="text-foreground/50 mb-3">Failed to load dashboard</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="text-gold hover:text-gold-light text-sm font-medium transition-colors"
        >
          Try again
        </button>
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
      color:
        stats.pendingFeedback > 0 ? "text-amber-400" : "text-foreground/60",
      bgColor:
        stats.pendingFeedback > 0 ? "bg-amber-400/10" : "bg-foreground/5",
      highlight: stats.pendingFeedback > 0,
    },
    {
      label: "Flagged Content",
      value: stats.pendingFlags,
      icon: AlertTriangle,
      color: stats.pendingFlags > 0 ? "text-red-400" : "text-foreground/60",
      bgColor: stats.pendingFlags > 0 ? "bg-red-400/10" : "bg-foreground/5",
      highlight: stats.pendingFlags > 0,
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
        <h1 className="text-foreground text-3xl font-bold">Dashboard</h1>
        <p className="text-foreground/50 mt-1">
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
                <p className="text-foreground/50 text-sm">{card.label}</p>
                <p className="text-foreground mt-1 text-3xl font-bold">
                  {card.value.toLocaleString()}
                </p>
                {card.subtitle && (
                  <p className="text-foreground/40 mt-1 text-xs">
                    {card.subtitle}
                  </p>
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
        <div className="border-foreground/10 bg-foreground/3 rounded-xl border p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-foreground text-lg font-semibold">
              Recent Signups
            </h2>
            <span className="text-foreground/40 text-xs">Last 5 users</span>
          </div>
          <div className="space-y-3">
            {stats.recentUsers.map((user) => (
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
            {stats.recentUsers.length === 0 && (
              <p className="text-foreground/40 py-4 text-center text-sm">
                No users yet
              </p>
            )}
          </div>
        </div>

        {/* Recent feedback */}
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
            {stats.recentFeedback.map((feedback) => (
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
            {stats.recentFeedback.length === 0 && (
              <p className="text-foreground/40 py-4 text-center text-sm">
                No feedback yet
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-8">
        <h2 className="text-foreground mb-4 text-lg font-semibold">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Link
            href="/admin/add-player"
            className="border-foreground/10 bg-foreground/3 hover:bg-foreground/6 flex items-center gap-3 rounded-xl border p-4 transition-colors"
          >
            <div className="bg-gold-300/10 rounded-lg p-2">
              <Plus className="text-gold-300 h-5 w-5" />
            </div>
            <div>
              <p className="text-foreground text-sm font-medium">Add Player</p>
              <p className="text-foreground/40 text-xs">
                Add a new player to the database
              </p>
            </div>
          </Link>
          <Link
            href="/admin/requested"
            className="border-foreground/10 bg-foreground/3 hover:bg-foreground/6 flex items-center gap-3 rounded-xl border p-4 transition-colors"
          >
            <div className="rounded-lg bg-rose-400/10 p-2">
              <UserPlus className="h-5 w-5 text-rose-400" />
            </div>
            <div>
              <p className="text-foreground text-sm font-medium">
                Requested Players
              </p>
              <p className="text-foreground/40 text-xs">
                Review player requests from users
              </p>
            </div>
          </Link>
          <Link
            href="/admin/feedback"
            className="border-foreground/10 bg-foreground/3 hover:bg-foreground/6 flex items-center gap-3 rounded-xl border p-4 transition-colors"
          >
            <div className="rounded-lg bg-amber-400/10 p-2">
              <Mail className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-foreground text-sm font-medium">Feedback</p>
              <p className="text-foreground/40 text-xs">
                Manage user feedback and messages
              </p>
            </div>
          </Link>
          <Link
            href="/admin/flagged"
            className="border-foreground/10 bg-foreground/3 hover:bg-foreground/6 flex items-center gap-3 rounded-xl border p-4 transition-colors"
          >
            <div className="rounded-lg bg-red-400/10 p-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-foreground text-sm font-medium">
                Flagged Content
              </p>
              <p className="text-foreground/40 text-xs">
                Review profanity-flagged content
              </p>
            </div>
          </Link>
          <Link
            href="/admin/users"
            className="border-foreground/10 bg-foreground/3 hover:bg-foreground/6 flex items-center gap-3 rounded-xl border p-4 transition-colors"
          >
            <div className="rounded-lg bg-blue-400/10 p-2">
              <Shield className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-foreground text-sm font-medium">
                User Management
              </p>
              <p className="text-foreground/40 text-xs">
                Manage users, bans, and suspensions
              </p>
            </div>
          </Link>
          <Link
            href="/test/player-images"
            className="border-foreground/10 bg-foreground/3 hover:bg-foreground/6 flex items-center gap-3 rounded-xl border p-4 transition-colors"
          >
            <div className="rounded-lg bg-red-400/10 p-2">
              <ImageOff className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-foreground text-sm font-medium">
                Test Player Images
              </p>
              <p className="text-foreground/40 text-xs">
                Check for broken player images
              </p>
            </div>
          </Link>
          <Link
            href="/admin/gamble-animations"
            className="border-foreground/10 bg-foreground/3 hover:bg-foreground/6 flex items-center gap-3 rounded-xl border p-4 transition-colors"
          >
            <div className="rounded-lg bg-green-400/10 p-2">
              <Sparkles className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-foreground text-sm font-medium">
                Gamble Animations
              </p>
              <p className="text-foreground/40 text-xs">
                Preview all gamble outcome animations
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
