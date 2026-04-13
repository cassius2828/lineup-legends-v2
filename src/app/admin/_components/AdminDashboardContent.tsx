"use client";

import { useMemo } from "react";
import { GoldCircleSpinnerLoader } from "~/app/_components/common/loaders";
import { buildStatCards } from "../_lib/buildStatCards";
import { useAdminDashboard } from "../_hooks/useAdminDashboard";
import { AdminStatsGrid } from "./AdminStatsGrid";
import { AdminRecentSignups } from "./AdminRecentSignups";
import { AdminRecentFeedback } from "./AdminRecentFeedback";
import { AdminQuickActions } from "./AdminQuickActions";

export function AdminDashboardContent() {
  const { stats, isLoading, isError, refetch } = useAdminDashboard();

  const statCards = useMemo(
    () => (stats ? buildStatCards(stats) : []),
    [stats],
  );

  if (isLoading || !stats) {
    return <GoldCircleSpinnerLoader />;
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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-foreground text-3xl font-bold">Dashboard</h1>
        <p className="text-foreground/50 mt-1">
          Overview of Lineup Legends activity and stats
        </p>
      </div>

      <AdminStatsGrid cards={statCards} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AdminRecentSignups users={stats.recentUsers} />
        <AdminRecentFeedback items={stats.recentFeedback} />
      </div>

      <AdminQuickActions />
    </div>
  );
}
