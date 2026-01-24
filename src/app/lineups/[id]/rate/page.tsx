"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "~/trpc/react";
import { PlayerCard } from "~/app/_components/PlayerCard";

export default function RateLineupPage() {
  const params = useParams();
  const router = useRouter();
  const lineupId = params.id as string;

  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  const { data: lineup, isLoading } = api.lineup.getById.useQuery({ id: lineupId });
  const { data: existingRating } = api.lineup.getUserRating.useQuery(
    { lineupId },
    { enabled: !!lineupId }
  );

  const rateMutation = api.lineup.rate.useMutation({
    onSuccess: () => {
      router.push("/lineups/explore");
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  // Set initial rating from existing
  useState(() => {
    if (existingRating) {
      setSelectedRating(existingRating.value);
    }
  });

  const handleSubmit = () => {
    if (selectedRating === null) return;
    rateMutation.mutate({ lineupId, value: selectedRating });
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        <div className="flex h-64 items-center justify-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-emerald-500" />
        </div>
      </main>
    );
  }

  if (!lineup) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-white">Lineup not found</h1>
          <Link href="/lineups/explore" className="mt-4 text-emerald-400 hover:underline">
            Back to Explore
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto max-w-2xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/lineups/explore"
            className="mb-2 inline-flex items-center gap-1 text-sm text-white/60 hover:text-white/80"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Explore
          </Link>
          <h1 className="text-3xl font-bold text-white">Rate Lineup</h1>
          <p className="mt-1 text-white/60">
            by {lineup.owner.name ?? lineup.owner.username ?? "Anonymous"}
          </p>
        </div>

        {/* Lineup Preview */}
        <div className="mb-8 rounded-2xl bg-slate-800/50 p-6">
          <div className="grid grid-cols-5 gap-3">
            {(["pg", "sg", "sf", "pf", "c"] as const).map((pos) => (
              <div key={pos} className="text-center">
                <span className="mb-1 block text-xs font-bold uppercase text-white/50">
                  {pos.toUpperCase()}
                </span>
                <PlayerCard player={lineup[pos]} compact />
              </div>
            ))}
          </div>

          {/* Current stats */}
          <div className="mt-4 flex justify-center gap-6 text-sm text-white/60">
            <span>
              Votes: <strong className="text-white">{lineup.totalVotes}</strong>
            </span>
            <span>
              Avg Rating:{" "}
              <strong className="text-gold">
                {lineup.avgRating > 0 ? lineup.avgRating.toFixed(1) : "-"}
              </strong>
            </span>
          </div>
        </div>

        {/* Rating Selector */}
        <div className="mb-8">
          <h2 className="mb-4 text-center text-lg font-semibold text-white">
            How would you rate this lineup?
          </h2>
          <div className="flex flex-wrap justify-center gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
              <button
                key={value}
                onClick={() => setSelectedRating(value)}
                className={`flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold transition-all ${
                  selectedRating === value
                    ? "bg-gold text-black scale-110"
                    : existingRating?.value === value
                      ? "bg-gold/30 text-gold"
                      : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
          {existingRating && (
            <p className="mt-3 text-center text-sm text-white/50">
              Your previous rating: {existingRating.value}
            </p>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <Link
            href="/lineups/explore"
            className="flex-1 rounded-lg bg-white/10 py-3 text-center font-medium text-white transition-colors hover:bg-white/20"
          >
            Cancel
          </Link>
          <button
            onClick={handleSubmit}
            disabled={selectedRating === null || rateMutation.isPending}
            className="flex-1 rounded-lg bg-gold py-3 font-semibold text-black transition-colors hover:bg-gold-light disabled:opacity-50"
          >
            {rateMutation.isPending ? "Submitting..." : "Submit Rating"}
          </button>
        </div>
      </div>
    </main>
  );
}

