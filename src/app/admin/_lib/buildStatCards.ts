import type { LucideIcon } from "lucide-react";
import {
  Users,
  Layers,
  Star,
  MessageSquare,
  UserPlus,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import type { RouterOutputs } from "~/trpc/react";

export type AdminStatCard = {
  label: string;
  value: number;
  subtitle?: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  highlight?: boolean;
};

type AdminStats = RouterOutputs["admin"]["getStats"];

export function buildStatCards(stats: AdminStats): AdminStatCard[] {
  return [
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
}
