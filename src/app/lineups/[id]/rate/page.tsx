"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { PlayerCard } from "~/app/_components/PlayerCard";
import { Button } from "~/app/_components/common/ui/Button";
import {
  RATING_MIN,
  RATING_MAX,
  RATING_STEP,
  RATING_DEFAULT,
} from "~/lib/constants";
import { getRatingColor } from "~/lib/rating-color";

export default function RateLineupPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;
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
      toast.error(error.message);
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
      <main className="from-surface-950 via-surface-800 to-surface-950 min-h-screen bg-gradient-to-b">
        <div className="flex h-64 items-center justify-center">
          <div className="border-foreground/20 border-t-gold mx-auto h-12 w-12 animate-spin rounded-full border-4" />
        </div>
      </main>
    );
  }

  if (!lineup) {
    return (
      <main className="from-surface-950 via-surface-800 to-surface-950 min-h-screen bg-gradient-to-b">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-foreground text-2xl font-bold">
            Lineup not found
          </h1>
          <Link
            href="/lineups/explore"
            className="text-gold-300 mt-4 hover:underline"
          >
            Back to Explore
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="from-surface-950 via-surface-800 to-surface-950 min-h-screen bg-gradient-to-b">
      <div className="container mx-auto max-w-2xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/lineups/explore"
            className="text-foreground/60 hover:text-foreground/80 mb-2 inline-flex items-center gap-1 text-sm"
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
          <h1 className="text-foreground text-3xl font-bold">Rate Lineup</h1>
          <p className="text-foreground/60 mt-1">
            by {lineup.owner.name ?? lineup.owner.username ?? "Anonymous"}
          </p>
        </div>

        {/* Lineup Preview */}
        <div className="bg-surface-800/50 mb-8 rounded-2xl p-6">
          <div className="grid grid-cols-5 gap-3">
            {(["pg", "sg", "sf", "pf", "c"] as const).map((pos) => (
              <div key={pos} className="text-center">
                <span className="text-foreground/50 mb-1 block text-xs font-bold uppercase">
                  {pos.toUpperCase()}
                </span>
                <PlayerCard player={lineup.players[pos]} compact />
              </div>
            ))}
          </div>

          {/* Current stats */}
          <div className="text-foreground/60 mt-4 flex justify-center gap-6 text-sm">
            <span>
              Number of ratings:{" "}
              <strong className="text-foreground">{lineup.ratingCount}</strong>
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
          <h2 className="text-foreground mb-4 text-center text-lg font-semibold">
            How would you rate this lineup?
          </h2>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4">
              <span className="text-foreground/50 text-sm">{RATING_MIN}</span>
              <input
                type="range"
                min={RATING_MIN}
                max={RATING_MAX}
                step={RATING_STEP}
                value={selectedRating}
                onChange={(e) => setSelectedRating(parseFloat(e.target.value))}
                style={{ accentColor: ratingColor }}
                className="bg-foreground/20 h-3 flex-1 appearance-none rounded-full [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[var(--rating-color)] [&::-moz-range-thumb]:bg-stone-100 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[var(--rating-color)] [&::-webkit-slider-thumb]:bg-stone-100 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-colors [&::-webkit-slider-thumb]:hover:scale-110"
              />
              <span className="text-foreground/50 text-sm">{RATING_MAX}</span>
            </div>
            <p
              className="text-center text-2xl font-bold tabular-nums transition-colors duration-150"
              style={{ color: ratingColor }}
            >
              {selectedRating.toFixed(2)}
            </p>
          </div>
          {lineup?.avgRating != null && lineup.avgRating > 0 && (
            <p className="text-foreground/50 mt-3 text-center text-sm">
              Lineup average: {lineup.avgRating.toFixed(2)}
            </p>
          )}
        </div>

        {/* Submit */}
        {isAuthenticated ? (
          <div className="flex gap-3">
            <Link
              href="/lineups/explore"
              className="bg-foreground/10 text-foreground hover:bg-foreground/20 flex-1 rounded-lg py-3 text-center font-medium transition-colors"
            >
              Cancel
            </Link>
            <Button
              onClick={handleSubmit}
              color="gold"
              variant="solid"
              loading={rateMutation.isPending}
              loadingText="Submitting..."
              className="flex-1 py-3 font-semibold"
            >
              Submit Rating
            </Button>
          </div>
        ) : (
          <div className="border-foreground/10 rounded-xl border p-6 text-center">
            <p className="text-foreground/50 text-sm">
              <a
                href="/api/auth/signin"
                className="text-gold hover:text-gold-light font-medium"
              >
                Sign in
              </a>{" "}
              to rate this lineup
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
