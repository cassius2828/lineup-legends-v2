"use client";

import Link from "next/link";
import { useState } from "react";
import { LineupCard } from "~/app/_components/LineupCard";
import { getId } from "~/lib/types";
import { api } from "~/trpc/react";

type SortOption = "newest" | "oldest" | "highest-rated" | "most-votes";

export default function MyLineupsPage() {
  const [sort, setSort] = useState<SortOption>("newest");
  const utils = api.useUtils();

  const { data: usersLineups, isLoading } =
    api.lineup.getLineupsByCurrentUser.useQuery({
      sort,
    });
  const { data: session } = api.profile.getMe.useQuery(undefined, {
    retry: false,
  });

  const deleteLineup = api.lineup.delete.useMutation({
    onSuccess: () => {
      void utils.lineup.getLineupsByCurrentUser.invalidate();
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  const toggleFeatured = api.lineup.toggleFeatured.useMutation({
    onSuccess: () => {
      void utils.lineup.getLineupsByCurrentUser.invalidate();
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this lineup?")) {
      deleteLineup.mutate({ id });
    }
  };

  const handleToggleFeatured = (id: string) => {
    toggleFeatured.mutate({ id });
  };
  console.log(usersLineups, " <-- lineups");
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">My Lineups</h1>
            <p className="mt-1 text-white/60">
              Manage your fantasy basketball lineups
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/lineups/explore"
              className="rounded-lg bg-white/10 px-4 py-2 font-medium text-white transition-colors hover:bg-white/20"
            >
              Explore Lineups
            </Link>
            <Link
              href="/lineups/new"
              className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-emerald-500"
            >
              + Create Lineup
            </Link>
          </div>
        </div>

        {/* Sort Controls */}
        <div className="mb-6 flex gap-2">
          {(
            [
              { value: "newest", label: "Newest" },
              { value: "oldest", label: "Oldest" },
              { value: "highest-rated", label: "Highest Rated" },
              { value: "most-votes", label: "Most Votes" },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              onClick={() => setSort(option.value)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                sort === option.value
                  ? "bg-emerald-600 text-white"
                  : "bg-white/10 text-white/70 hover:bg-white/20"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Lineups Grid */}
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-emerald-500" />
              <p className="text-white/60">Loading lineups...</p>
            </div>
          </div>
        ) : usersLineups && usersLineups.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {usersLineups.map((lineup) => (
              <LineupCard
                key={lineup._id?.toString() ?? ""}
                lineup={lineup}
                showOwner={false}
                isOwner={true}
                currentUserId={getId(session)}
                onDelete={handleDelete}
                onToggleFeatured={handleToggleFeatured}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-white/5 p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
              <svg
                className="h-8 w-8 text-white/40"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-semibold text-white">
              No lineups yet
            </h3>
            <p className="mb-6 text-white/60">
              Create your first lineup to get started!
            </p>
            <Link
              href="/lineups/new"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-emerald-500"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create Your First Lineup
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
