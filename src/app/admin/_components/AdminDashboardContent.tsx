"use client";

import { useMemo } from "react";
import { GoldCircleSpinnerLoader } from "~/app/_components/common/loaders";
import { buildStatCards } from "../_lib/buildStatCards";
import { useAdminDashboard } from "../_hooks/useAdminDashboard";
import { AdminErrorState } from "../components/shared";
import { AdminPageHeader } from "./AdminPageHeader";
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
      <AdminErrorState
        message="Failed to load dashboard"
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <div>
      <AdminPageHeader
        title="Dashboard"
        description="Overview of Lineup Legends activity and stats"
      />

      <AdminStatsGrid cards={statCards} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AdminRecentSignups users={stats.recentUsers} />
        <AdminRecentFeedback items={stats.recentFeedback} />
      </div>

      <AdminQuickActions />
    </div>
  );
}
