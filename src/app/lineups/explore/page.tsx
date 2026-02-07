"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LineupCard,
  type LineupWithRelations,
} from "~/app/_components/LineupCard";
import { api } from "~/trpc/react";
import { getId } from "~/lib/types";
import { ButtonLink } from "~/app/_components/ui/Button";
import LineupsHeader from "~/app/_components/Header/Header";

type SortOption = "newest" | "oldest" | "highest-rated" | "most-votes";

export default function ExploreLineupsPage() {
  const [sort, setSort] = useState<SortOption>("newest");
  const utils = api.useUtils();

  const { data: lineups, isLoading } = api.lineup.getAllLineups.useQuery({
    sort,
  });
  const { data: session } = api.profile.getMe.useQuery(undefined, {
    retry: false,
  });

  const voteMutation = api.lineup.lineupVote.useMutation({
    onSuccess: () => {
      void utils.lineup.getAllLineups.invalidate();
    },
  });

  // Track user votes per lineup
  const userVotes = new Map<string, "upvote" | "downvote">();

  const handleVote = (lineupId: string, type: "upvote" | "downvote") => {
    voteMutation.mutate({ lineupId, type });
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <LineupsHeader
          title="Explore Lineups"
          description="Discover lineups from the community"
          exploreLink="/lineups"
          createLink="/lineups/new"
          exploreLinkText="My Lineups"
          createLinkText="+ Create Lineup"
        />

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
        ) : lineups && lineups.length > 0 ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {lineups.map((lineup) => (
              <LineupCard
                key={getId(lineup)}
                // improve type safety later
                lineup={lineup}
                showOwner={true}
                isOwner={false}
                currentUserId={getId(session)}
                onVote={handleVote}
                userVote={userVotes.get(getId(lineup))}
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-semibold text-white">
              No lineups to explore
            </h3>
            <p className="mb-6 text-white/60">
              Be the first to create a lineup!
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
              Create a Lineup
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
