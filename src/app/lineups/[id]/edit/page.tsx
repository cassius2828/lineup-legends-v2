"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "~/trpc/react";
import type { Player } from "../../../../../generated/prisma";

const POSITIONS = ["pg", "sg", "sf", "pf", "c"] as const;
const POSITION_LABELS = {
  pg: "Point Guard",
  sg: "Shooting Guard",
  sf: "Small Forward",
  pf: "Power Forward",
  c: "Center",
};

export default function EditLineupPage() {
  const params = useParams();
  const router = useRouter();
  const lineupId = params.id as string;

  const { data: lineup, isLoading } = api.lineup.getById.useQuery({ id: lineupId });

  const [positions, setPositions] = useState<Record<typeof POSITIONS[number], Player | null>>({
    pg: null,
    sg: null,
    sf: null,
    pf: null,
    c: null,
  });

  useEffect(() => {
    if (lineup) {
      setPositions({
        pg: lineup.pg,
        sg: lineup.sg,
        sf: lineup.sf,
        pf: lineup.pf,
        c: lineup.c,
      });
    }
  }, [lineup]);

  const reorderMutation = api.lineup.reorder.useMutation({
    onSuccess: () => {
      router.push("/lineups");
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  const handleSwap = (pos1: typeof POSITIONS[number], pos2: typeof POSITIONS[number]) => {
    setPositions((prev) => ({
      ...prev,
      [pos1]: prev[pos2],
      [pos2]: prev[pos1],
    }));
  };

  const handleSubmit = () => {
    if (!positions.pg || !positions.sg || !positions.sf || !positions.pf || !positions.c) {
      return;
    }

    reorderMutation.mutate({
      lineupId,
      pgId: positions.pg.id,
      sgId: positions.sg.id,
      sfId: positions.sf.id,
      pfId: positions.pf.id,
      cId: positions.c.id,
    });
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
          <Link href="/lineups" className="mt-4 text-emerald-400 hover:underline">
            Back to My Lineups
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
            href="/lineups"
            className="mb-2 inline-flex items-center gap-1 text-sm text-white/60 hover:text-white/80"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to My Lineups
          </Link>
          <h1 className="text-3xl font-bold text-white">Reorder Lineup</h1>
          <p className="mt-1 text-white/60">
            Click two positions to swap players
          </p>
        </div>

        {/* Position Cards */}
        <div className="space-y-3">
          {POSITIONS.map((pos, index) => {
            const player = positions[pos];
            if (!player) return null;

            return (
              <div
                key={pos}
                className="flex items-center gap-4 rounded-xl bg-slate-800/80 p-4"
              >
                <span className="w-8 text-center text-lg font-bold text-white/40">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <span className="text-xs font-bold uppercase text-white/50">
                    {POSITION_LABELS[pos]}
                  </span>
                  <div className="mt-1 flex items-center gap-3">
                    <img
                      src={player.imgUrl}
                      alt={`${player.firstName} ${player.lastName}`}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold text-white">
                        {player.firstName} {player.lastName}
                      </p>
                      <p className="text-sm text-white/50">${player.value}</p>
                    </div>
                  </div>
                </div>

                {/* Swap buttons */}
                <div className="flex gap-1">
                  {index > 0 && (
                    <button
                      onClick={() => handleSwap(pos, POSITIONS[index - 1]!)}
                      className="rounded-lg bg-white/10 p-2 text-white/60 transition-colors hover:bg-white/20 hover:text-white"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                  )}
                  {index < POSITIONS.length - 1 && (
                    <button
                      onClick={() => handleSwap(pos, POSITIONS[index + 1]!)}
                      className="rounded-lg bg-white/10 p-2 text-white/60 transition-colors hover:bg-white/20 hover:text-white"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Submit */}
        <div className="mt-8 flex gap-3">
          <Link
            href="/lineups"
            className="flex-1 rounded-lg bg-white/10 py-3 text-center font-medium text-white transition-colors hover:bg-white/20"
          >
            Cancel
          </Link>
          <button
            onClick={handleSubmit}
            disabled={reorderMutation.isPending}
            className="flex-1 rounded-lg bg-emerald-600 py-3 font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
          >
            {reorderMutation.isPending ? "Saving..." : "Save Order"}
          </button>
        </div>
      </div>
    </main>
  );
}

