"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  SlidersHorizontal,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from "lucide-react";
import Image from "next/image";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isAfter,
  isBefore,
} from "date-fns";
import { api } from "~/trpc/react";
import type {
  LineupFilterState,
  DateRangePreset,
} from "~/hooks/useLineupFilters";

interface LineupFiltersProps {
  filters: LineupFilterState;
  onFiltersChange: (filters: LineupFilterState) => void;
  activeFilterCount: number;
  showUserFilter?: boolean;
  excludeUserId?: string;
}

const DATE_PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
];

export default function LineupFilters({
  filters,
  onFiltersChange,
  activeFilterCount,
  showUserFilter = false,
  excludeUserId,
}: LineupFiltersProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const setDateRange = (value: DateRangePreset | undefined) =>
    onFiltersChange({
      ...filters,
      dateRange: value,
      customDateFrom: undefined,
      customDateTo: undefined,
    });

  const setCustomDateRange = (from?: Date, to?: Date) =>
    onFiltersChange({
      ...filters,
      dateRange: undefined,
      customDateFrom: from,
      customDateTo: to,
    });

  const clearDateFilter = () =>
    onFiltersChange({
      ...filters,
      dateRange: undefined,
      customDateFrom: undefined,
      customDateTo: undefined,
    });

  const setMinRating = (value: number | undefined) =>
    onFiltersChange({ ...filters, minRating: value });

  const setUser = (userId?: string, userName?: string) =>
    onFiltersChange({ ...filters, userId, userName });

  const clearAll = () => onFiltersChange({});

  const hasCustomDate = !!(filters.customDateFrom || filters.customDateTo);

  const customDateLabel = hasCustomDate
    ? filters.customDateFrom && filters.customDateTo
      ? `${format(filters.customDateFrom, "MMM d")} – ${format(filters.customDateTo, "MMM d")}`
      : filters.customDateFrom
        ? `From ${format(filters.customDateFrom, "MMM d")}`
        : `Until ${format(filters.customDateTo!, "MMM d")}`
    : "";

  return (
    <div className="flex items-center gap-1.5">
      {/* Filter trigger */}
      <div className="relative" ref={panelRef}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={`border-foreground/20 hover:border-foreground/40 text-foreground/60 hover:text-foreground/80 flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
            activeFilterCount > 0 ? "border-gold/40 text-foreground/80" : ""
          }`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>Filter</span>
          {activeFilterCount > 0 && (
            <span className="bg-gold ml-0.5 h-1.5 w-1.5 rounded-full" />
          )}
        </button>

        {/* Dropdown panel — desktop: absolute below trigger */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.12 }}
              className="bg-surface-800 border-foreground/10 absolute top-full left-0 z-50 mt-2 hidden w-72 rounded-xl border p-4 shadow-2xl md:block"
            >
              <FilterDropdownContent
                filters={filters}
                activeFilterCount={activeFilterCount}
                showUserFilter={showUserFilter}
                excludeUserId={excludeUserId}
                onClearAll={clearAll}
                onSetDateRange={setDateRange}
                onSetCustomDateRange={setCustomDateRange}
                onSetMinRating={setMinRating}
                onSetUser={setUser}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dropdown panel — mobile: fixed centered overlay */}
        <AnimatePresence>
          {open && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="fixed inset-0 z-40 bg-black/40 md:hidden"
                onClick={() => setOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.12 }}
                className="bg-surface-800 border-foreground/10 fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-72 -translate-x-1/2 -translate-y-1/2 rounded-xl border p-4 shadow-2xl md:hidden"
              >
                <FilterDropdownContent
                  filters={filters}
                  activeFilterCount={activeFilterCount}
                  showUserFilter={showUserFilter}
                  excludeUserId={excludeUserId}
                  onClearAll={clearAll}
                  onSetDateRange={setDateRange}
                  onSetCustomDateRange={setCustomDateRange}
                  onSetMinRating={setMinRating}
                  onSetUser={setUser}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Active filter chips */}
      {filters.dateRange && (
        <FilterChip
          label={
            DATE_PRESETS.find((p) => p.value === filters.dateRange)?.label ?? ""
          }
          onRemove={() => clearDateFilter()}
        />
      )}
      {hasCustomDate && (
        <FilterChip
          label={customDateLabel}
          onRemove={() => clearDateFilter()}
        />
      )}
      {filters.minRating != null && (
        <FilterChip
          label={`≥ ${filters.minRating}`}
          onRemove={() => setMinRating(undefined)}
        />
      )}
      {filters.userId && (
        <FilterChip
          label={`@${filters.userName ?? "user"}`}
          onRemove={() => setUser(undefined, undefined)}
        />
      )}
    </div>
  );
}

function FilterDropdownContent({
  filters,
  activeFilterCount,
  showUserFilter,
  excludeUserId,
  onClearAll,
  onSetDateRange,
  onSetCustomDateRange,
  onSetMinRating,
  onSetUser,
}: {
  filters: LineupFilterState;
  activeFilterCount: number;
  showUserFilter: boolean;
  excludeUserId?: string;
  onClearAll: () => void;
  onSetDateRange: (v: DateRangePreset | undefined) => void;
  onSetCustomDateRange: (from?: Date, to?: Date) => void;
  onSetMinRating: (v: number | undefined) => void;
  onSetUser: (id?: string, name?: string) => void;
}) {
  const [showCalendar, setShowCalendar] = useState(false);

  const hasCustomDate = !!(filters.customDateFrom || filters.customDateTo);

  return (
    <>
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-foreground/80 text-xs font-semibold tracking-wider uppercase">
          Filters
        </span>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-foreground/40 hover:text-foreground/70 text-xs transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Date Range */}
      <FilterSection label="Date">
        <div className="flex flex-wrap items-center gap-1.5">
          {DATE_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => {
                setShowCalendar(false);
                onSetDateRange(
                  filters.dateRange === preset.value ? undefined : preset.value,
                );
              }}
              className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                filters.dateRange === preset.value
                  ? "bg-gold/20 text-gold ring-gold/40 ring-1"
                  : "bg-foreground/5 text-foreground/60 hover:bg-foreground/10"
              }`}
            >
              {preset.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowCalendar((v) => !v)}
            className={`rounded-md px-2 py-1 text-xs transition-colors ${
              showCalendar || hasCustomDate
                ? "bg-gold/20 text-gold ring-gold/40 ring-1"
                : "bg-foreground/5 text-foreground/60 hover:bg-foreground/10"
            }`}
            title="Pick custom dates"
          >
            <Calendar className="h-3.5 w-3.5" />
          </button>
        </div>

        {showCalendar && (
          <div className="mt-2">
            <MiniCalendarRangePicker
              from={filters.customDateFrom}
              to={filters.customDateTo}
              onChange={(from, to) => onSetCustomDateRange(from, to)}
            />
          </div>
        )}
      </FilterSection>

      {/* Min Rating */}
      <FilterSection label="Min Rating">
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={10}
            step={0.5}
            value={filters.minRating ?? 0}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              onSetMinRating(v === 0 ? undefined : v);
            }}
            className="accent-gold [&::-webkit-slider-thumb]:bg-gold h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-white/10 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full"
          />
          <span className="text-foreground/60 w-8 text-right text-xs tabular-nums">
            {filters.minRating ?? 0}
          </span>
        </div>
      </FilterSection>

      {/* User search (explore only) */}
      {showUserFilter && (
        <FilterSection label="By User" last>
          {filters.userId ? (
            <div className="bg-foreground/5 flex items-center justify-between rounded-md px-2.5 py-1.5">
              <span className="text-foreground/70 text-xs">
                @{filters.userName ?? "user"}
              </span>
              <button
                type="button"
                onClick={() => onSetUser(undefined, undefined)}
                className="text-foreground/40 hover:text-foreground/70 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <UserSearch
              excludeUserId={excludeUserId}
              onSelect={(id, name) => onSetUser(id, name)}
            />
          )}
        </FilterSection>
      )}
    </>
  );
}

function FilterSection({
  label,
  children,
  last,
}: {
  label: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      className={
        last ? "pt-3" : "border-foreground/10 border-b pt-3 pb-3 first:pt-0"
      }
    >
      <span className="text-foreground/40 mb-2 block text-[10px] font-semibold tracking-wider uppercase">
        {label}
      </span>
      {children}
    </div>
  );
}

function FilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="bg-foreground/10 text-foreground/70 inline-flex items-center gap-1 rounded-full py-0.5 pr-1.5 pl-2.5 text-xs">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="hover:text-foreground transition-colors"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

function MiniCalendarRangePicker({
  from,
  to,
  onChange,
}: {
  from?: Date;
  to?: Date;
  onChange: (from?: Date, to?: Date) => void;
}) {
  const [viewMonth, setViewMonth] = useState(from ?? new Date());
  const [selecting, setSelecting] = useState<"from" | "to">(
    from ? "to" : "from",
  );

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days: Date[] = [];
  const d = new Date(calStart);
  while (d <= calEnd) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }

  const handleDayClick = (day: Date) => {
    if (selecting === "from") {
      if (to && isAfter(day, to)) {
        onChange(day, undefined);
      } else {
        onChange(day, to);
      }
      setSelecting("to");
    } else {
      if (from && isBefore(day, from)) {
        onChange(day, undefined);
        setSelecting("to");
      } else {
        onChange(from, day);
        setSelecting("from");
      }
    }
  };

  const isInRange = (day: Date) => {
    if (!from || !to) return false;
    return isAfter(day, from) && isBefore(day, to);
  };

  const isSelected = (day: Date) =>
    (from && isSameDay(day, from)) || (to && isSameDay(day, to));

  const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <div>
      {/* Selecting indicator */}
      <div className="mb-2 flex gap-2">
        <button
          type="button"
          onClick={() => setSelecting("from")}
          className={`flex-1 rounded-md px-2 py-1 text-center text-[10px] transition-colors ${
            selecting === "from"
              ? "bg-gold/20 text-gold ring-gold/40 ring-1"
              : "bg-foreground/5 text-foreground/50"
          }`}
        >
          {from ? format(from, "MMM d, yyyy") : "Start date"}
        </button>
        <span className="text-foreground/30 self-center text-[10px]">–</span>
        <button
          type="button"
          onClick={() => setSelecting("to")}
          className={`flex-1 rounded-md px-2 py-1 text-center text-[10px] transition-colors ${
            selecting === "to"
              ? "bg-gold/20 text-gold ring-gold/40 ring-1"
              : "bg-foreground/5 text-foreground/50"
          }`}
        >
          {to ? format(to, "MMM d, yyyy") : "End date"}
        </button>
      </div>

      {/* Month navigation */}
      <div className="mb-1.5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setViewMonth((m) => subMonths(m, 1))}
          className="text-foreground/40 hover:text-foreground/70 rounded p-0.5 transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <span className="text-foreground/70 text-[11px] font-medium">
          {format(viewMonth, "MMMM yyyy")}
        </span>
        <button
          type="button"
          onClick={() => setViewMonth((m) => addMonths(m, 1))}
          className="text-foreground/40 hover:text-foreground/70 rounded p-0.5 transition-colors"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-0">
        {WEEKDAYS.map((wd) => (
          <div
            key={wd}
            className="text-foreground/30 py-1 text-center text-[9px] font-medium"
          >
            {wd}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-0">
        {days.map((day) => {
          const inMonth = isSameMonth(day, viewMonth);
          const selected = isSelected(day);
          const inRange = isInRange(day);

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => handleDayClick(day)}
              className={`h-7 text-[10px] transition-colors ${
                !inMonth
                  ? "text-foreground/15"
                  : selected
                    ? "bg-gold rounded-md font-semibold text-black"
                    : inRange
                      ? "bg-gold/10 text-foreground/80"
                      : "text-foreground/60 hover:bg-foreground/10 rounded-md"
              }`}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>

      {/* Clear dates */}
      {(from || to) && (
        <button
          type="button"
          onClick={() => {
            onChange(undefined, undefined);
            setSelecting("from");
          }}
          className="text-foreground/40 hover:text-foreground/60 mt-1.5 w-full text-center text-[10px] transition-colors"
        >
          Clear dates
        </button>
      )}
    </div>
  );
}

function UserSearch({
  excludeUserId,
  onSelect,
}: {
  excludeUserId?: string;
  onSelect: (id: string, name: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const { data: users } = api.follow.searchUsers.useQuery(
    { query: debounced, limit: 6 },
    { enabled: debounced.length >= 1 },
  );

  const filtered = users?.filter((u) => u.id !== excludeUserId);

  return (
    <div>
      <div className="bg-foreground/5 flex items-center gap-2 rounded-md px-2.5 py-1.5">
        <Search className="text-foreground/30 h-3.5 w-3.5 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users..."
          className="text-foreground placeholder:text-foreground/30 w-full bg-transparent text-xs outline-none"
        />
      </div>
      {filtered && filtered.length > 0 && (
        <div className="mt-1.5 max-h-40 space-y-0.5 overflow-y-auto">
          {filtered.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => onSelect(user.id, user.username ?? user.name)}
              className="hover:bg-foreground/5 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors"
            >
              <Image
                src={user.profileImg ?? user.image ?? "/default-user.jpg"}
                alt={user.name}
                width={20}
                height={20}
                className="rounded-full"
              />
              <div className="min-w-0 flex-1">
                <p className="text-foreground/80 truncate text-xs font-medium">
                  {user.name}
                </p>
                {user.username && (
                  <p className="text-foreground/40 truncate text-[10px]">
                    @{user.username}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
