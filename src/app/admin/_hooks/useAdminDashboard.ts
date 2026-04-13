import { api } from "~/trpc/react";

export function useAdminDashboard() {
  const {
    data: stats,
    isLoading,
    isError,
    refetch,
  } = api.admin.getStats.useQuery();

  return {
    stats,
    isLoading,
    isError,
    refetch,
  };
}
