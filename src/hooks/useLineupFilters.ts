"use client";

import { useState, useCallback, useMemo } from "react";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
} from "date-fns";
import type { LineupOutput } from "~/server/api/schemas/output";

export type DateRangePreset = "today" | "week" | "month" | "year";

export interface LineupFilterState {
  dateRange?: DateRangePreset;
  customDateFrom?: Date;
  customDateTo?: Date;
  minRating?: number;
  userId?: string;
  userName?: string;
}

const DATE_RANGE_START: Record<DateRangePreset, () => Date> = {
  today: () => startOfDay(new Date()),
  week: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  month: () => startOfMonth(new Date()),
  year: () => startOfYear(new Date()),
};

export function useLineupFilters() {
  const [filters, setFilters] = useState<LineupFilterState>({});

  const hasDateFilter = !!(
    filters.dateRange ||
    filters.customDateFrom ||
    filters.customDateTo
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (hasDateFilter) count++;
    if (filters.minRating != null) count++;
    if (filters.userId) count++;
    return count;
  }, [hasDateFilter, filters.minRating, filters.userId]);

  const filterLineups = useCallback(
    (lineups: LineupOutput[]) => {
      if (activeFilterCount === 0) return lineups;

      return lineups.filter((lineup) => {
        if (filters.dateRange) {
          const cutoff = DATE_RANGE_START[filters.dateRange]();
          if (new Date(lineup.createdAt) < cutoff) return false;
        } else if (filters.customDateFrom || filters.customDateTo) {
          const created = new Date(lineup.createdAt);
          if (
            filters.customDateFrom &&
            created < startOfDay(filters.customDateFrom)
          )
            return false;
          if (filters.customDateTo && created > endOfDay(filters.customDateTo))
            return false;
        }

        if (filters.minRating != null && lineup.avgRating < filters.minRating) {
          return false;
        }

        if (filters.userId && lineup.owner._id !== filters.userId) {
          return false;
        }

        return true;
      });
    },
    [filters, activeFilterCount],
  );

  const clearFilters = useCallback(() => setFilters({}), []);

  return {
    filters,
    setFilters,
    filterLineups,
    clearFilters,
    activeFilterCount,
  };
}
