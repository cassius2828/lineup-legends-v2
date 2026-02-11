"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import LineupCardGrid from "~/app/_components/common/LineupCardGrid";
import LineupsHeader from "~/app/_components/Header/LineupsHeader";
import { LineupCard } from "~/app/_components/LineupCard/LineupCard";
import { getId } from "~/lib/types";
import { getVoteDelta } from "~/lib/utils";
import { api } from "~/trpc/react";

type SortOption = "newest" | "oldest" | "highest-rated" | "most-votes";

export default function ExploreLineupsPage() {
  const [sort, setSort] = useState<SortOption>("newest");
  const utils = api.useUtils();
  const { data: session } = useSession();
  const { data: lineups, isLoading } =
    api.lineup.getLineupsByOtherUsers.useQuery({
      sort,
      userId: session?.user.id ?? "",
    });
  // figure out simplest way to handle optimistic vote
  const queryInput = { sort, userId: session?.user.id ?? "" };

  const voteMutation = api.lineup.lineupVote.useMutation({
    onMutate: async (input) => {
      // cancel any outgoing refetches so we don't overwrite the optimistic update
      await utils.lineup.getLineupsByOtherUsers.cancel(queryInput);
      // get snapshot of the previous data
      const previousLineups =
        utils.lineup.getLineupsByOtherUsers.getData(queryInput);
      const previousVote = userVotes.get(input.lineupId) ?? null;

      // compute delta + next vote (toggle/switch)
      const voteDelta = getVoteDelta(input.type, previousVote);

      // optimistically update the list cache
      utils.lineup.getLineupsByOtherUsers.setData(queryInput, (old) => {
        if (!old) return old;
        return old.map((lineup) => {
          if (getId(lineup) !== input.lineupId) return lineup;
          return {
            ...lineup,
            totalVotes: (lineup.totalVotes ?? 0) + voteDelta,
          } as (typeof old)[number];
        }) as typeof old;
      });

      // optimistically update the vote cache
      userVotes.set(input.lineupId, input.type);

      return { previousLineups, previousVote, lineupId: input.lineupId };
    },
    onSuccess: (lineup) => {
      // void utils.lineup.getAllLineups.invalidate();
      // invalidate the lineup based on the lineup id
      void utils.lineup.getLineupById.invalidate({
        id: lineup?._id?.toString() ?? "",
      });
    },
    onError: (_err, _input, ctx) => {
      if (!ctx) return;

      utils.lineup.getLineupsByOtherUsers.setData(
        queryInput,
        ctx.previousLineups,
      );
      userVotes.delete(ctx.lineupId);
      (toast as { error: (message: string) => void }).error(
        "Error voting on lineup",
      );
    },
    onSettled: async (_data, _error, vars) => {
      await utils.lineup.getLineupsByOtherUsers.invalidate(queryInput);
      if (vars?.lineupId) {
        await utils.lineup.getLineupById.invalidate({
          id: vars.lineupId,
        });
      }
    },
  });

  // Track user votes per lineup
  const userVotes = new Map<string, "upvote" | "downvote">();

  const handleVote = (lineupId: string, type: "upvote" | "downvote") => {
    if (voteMutation.isPending) return;
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
          <LineupCardGrid>
            {lineups.map((lineup) => (
              <LineupCard
                key={getId(lineup)}
                // improve type safety later
                lineup={lineup}
                showOwner={true}
                isOwner={false}
                currentUserId={session?.user.id ?? ""}
                onVote={handleVote}
                userVote={userVotes.get(getId(lineup))}
              />
            ))}
          </LineupCardGrid>
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
