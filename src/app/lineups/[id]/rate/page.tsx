"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "~/trpc/react";
import { PlayerCard } from "~/app/_components/PlayerCard";

const RATING_MIN = 0.01;
const RATING_MAX = 10;
const RATING_STEP = 0.01;
const RATING_DEFAULT = 5;

// Rating color scale: deep red → orange → yellow → green → diamond (#99fcff)
const RATING_COLORS = [
  { at: 0.01, hex: "#7f1d1d" }, // dark red
  { at: 2.5, hex: "#ea580c" }, // orange
  { at: 5, hex: "#eab308" }, // yellow
  { at: 7.5, hex: "#22c55e" }, // green
  { at: 10, hex: "#99fcff" }, // diamond light blue
] as const;

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, "0")).join("")
  );
}

function getRatingColor(rating: number): string {
  const r = Math.max(RATING_MIN, Math.min(RATING_MAX, rating));
  let i = 0;
  // understand how this works, the complexity, and how to improve perf
  while (i < RATING_COLORS.length - 1 && RATING_COLORS[i + 1]!.at < r) i++;
  const low = RATING_COLORS[i]!;
  const high = RATING_COLORS[i + 1] ?? low;
  const t = low.at === high.at ? 1 : (r - low.at) / (high.at - low.at);
  const [r1, g1, b1] = hexToRgb(low.hex);
  const [r2, g2, b2] = hexToRgb(high.hex);
  return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

export default function RateLineupPage() {
  const params = useParams();
  const router = useRouter();
  const lineupId = params.id as string;

  const [selectedRating, setSelectedRating] = useState<number>(RATING_DEFAULT);

  const { data: lineup, isLoading } = api.lineup.getLineupById.useQuery({
    id: lineupId,
  });

  const rateMutation = api.lineup.rate.useMutation({
    onSuccess: () => {
      router.push("/lineups/explore");
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  useEffect(() => {
    if (lineup?.avgRating != null && lineup.avgRating > 0) {
      setSelectedRating(
        Math.min(RATING_MAX, Math.max(RATING_MIN, lineup.avgRating)),
      );
    }
  }, [lineup?.avgRating]);

  const handleSubmit = () => {
    rateMutation.mutate({ lineupId, value: selectedRating });
  };

  const ratingColor = getRatingColor(selectedRating);

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
          <Link
            href="/lineups/explore"
            className="mt-4 text-emerald-400 hover:underline"
          >
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
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
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
                <span className="mb-1 block text-xs font-bold text-white/50 uppercase">
                  {pos.toUpperCase()}
                </span>
                <PlayerCard player={lineup.players[pos]} compact />
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

        {/* Rating Slider */}
        <div
          className="mb-8"
          style={{ ["--rating-color"]: ratingColor } as React.CSSProperties}
        >
          <h2 className="mb-4 text-center text-lg font-semibold text-white">
            How would you rate this lineup?
          </h2>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-white/50">{RATING_MIN}</span>
              <input
                type="range"
                min={RATING_MIN}
                max={RATING_MAX}
                step={RATING_STEP}
                value={selectedRating}
                onChange={(e) => setSelectedRating(parseFloat(e.target.value))}
                style={{ accentColor: ratingColor }}
                className="h-3 flex-1 appearance-none rounded-full bg-white/20 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[var(--rating-color)] [&::-moz-range-thumb]:bg-stone-100 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[var(--rating-color)] [&::-webkit-slider-thumb]:bg-stone-100 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-colors [&::-webkit-slider-thumb]:hover:scale-110"
              />
              <span className="text-sm text-white/50">{RATING_MAX}</span>
            </div>
            <p
              className="text-center text-2xl font-bold tabular-nums transition-colors duration-150"
              style={{ color: ratingColor }}
            >
              {selectedRating.toFixed(2)}
            </p>
          </div>
          {lineup?.avgRating != null && lineup.avgRating > 0 && (
            <p className="mt-3 text-center text-sm text-white/50">
              Lineup average: {lineup.avgRating.toFixed(2)}
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
            disabled={rateMutation.isPending}
            className="bg-gold hover:bg-gold-light flex-1 rounded-lg py-3 font-semibold text-black transition-colors disabled:opacity-50"
          >
            {rateMutation.isPending ? "Submitting..." : "Submit Rating"}
          </button>
        </div>
      </div>
    </main>
  );
}
