"use client";

import { useState, useCallback } from "react";
import { AdminBackLink } from "../_components/AdminBackLink";
import { AdminPageHeader } from "../_components/AdminPageHeader";
import type {
  GambleOutcomeTier,
  PlayerOutput,
} from "~/server/api/schemas/output";
import { GambleReveal } from "~/app/lineups/[id]/gamble/_components/GambleReveal";
import {
  VALUE_COLORS,
  VALUE_LABELS,
  getOutcomeCategory,
  getTierConfig,
} from "~/app/lineups/[id]/gamble/_components/gamble-reveal-utils";

const OUTCOME_TIERS: {
  tier: GambleOutcomeTier;
  label: string;
  description: string;
  prevValue: number;
  newValue: number;
}[] = [
  {
    tier: "jackpot",
    label: "Jackpot",
    description: "+4 value jump ($1 → $5 Diamond)",
    prevValue: 1,
    newValue: 5,
  },
  {
    tier: "big_win",
    label: "Big Win",
    description: "+2 value jump ($3 → $5 Diamond)",
    prevValue: 3,
    newValue: 5,
  },
  {
    tier: "upgrade",
    label: "Upgrade",
    description: "+1 value jump ($3 → $4 Amethyst)",
    prevValue: 3,
    newValue: 4,
  },
  {
    tier: "neutral",
    label: "Neutral",
    description: "Same value (e.g. $3 → $3)",
    prevValue: 3,
    newValue: 3,
  },
  {
    tier: "downgrade",
    label: "Downgrade",
    description: "-1 value drop (e.g. $3 → $2)",
    prevValue: 3,
    newValue: 2,
  },
  {
    tier: "big_loss",
    label: "Big Loss",
    description: "-2 value drop (e.g. $4 → $2)",
    prevValue: 4,
    newValue: 2,
  },
  {
    tier: "disaster",
    label: "Disaster",
    description: "-3 value drop (e.g. $5 → $2)",
    prevValue: 5,
    newValue: 2,
  },
];

function mockPlayer(value: number): PlayerOutput {
  const label = VALUE_LABELS[value] ?? "Unknown";
  return {
    _id: `mock-${value}`,
    id: `mock-${value}`,
    firstName: `$${value}`,
    lastName: label,
    imgUrl: "",
    value,
  };
}

export default function GambleAnimationsTestPage() {
  const [activeTier, setActiveTier] = useState<GambleOutcomeTier | null>(null);
  const [animKey, setAnimKey] = useState(0);

  const activeConfig = OUTCOME_TIERS.find((t) => t.tier === activeTier);

  const handleSelect = (tier: GambleOutcomeTier) => {
    setActiveTier(tier);
    setAnimKey((k) => k + 1);
  };

  const handleComplete = useCallback(() => {
    // no-op: animation finished, user can pick another
  }, []);

  const handleReplay = () => {
    setAnimKey((k) => k + 1);
  };

  return (
    <div>
      <AdminBackLink href="/admin">Back to Admin</AdminBackLink>
      <AdminPageHeader
        title={
          <>
            Gamble Animation <span className="text-green-400">Tester</span>
          </>
        }
        description="Preview all 7 outcome tier animations. Pick a tier to demo it."
      />

      {/* Tier selector grid */}
      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {OUTCOME_TIERS.map(({ tier, label, description, newValue }) => {
          const category = getOutcomeCategory(tier);
          const config = getTierConfig(tier);
          const tierColor = VALUE_COLORS[newValue] ?? "#e3b920";
          const isActive = activeTier === tier;

          return (
            <button
              key={tier}
              onClick={() => handleSelect(tier)}
              className={`group relative rounded-xl border p-4 text-left transition-all ${
                isActive
                  ? "border-green-500 bg-green-500/10 ring-1 ring-green-500/50"
                  : "border-foreground/10 bg-foreground/3 hover:border-foreground/20 hover:bg-foreground/5"
              }`}
            >
              {/* Tier color indicator dot */}
              <div className="mb-2 flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{
                    backgroundColor: tierColor,
                    boxShadow: `0 0 8px ${tierColor}80`,
                  }}
                />
                <span
                  className="text-sm font-bold tracking-wide uppercase"
                  style={{
                    color:
                      category === "positive"
                        ? tierColor
                        : category === "negative"
                          ? "#ef4444"
                          : "#9ca3af",
                  }}
                >
                  {label}
                </span>
              </div>

              <p className="text-foreground/40 text-xs">{description}</p>

              {/* Quick stats */}
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="bg-foreground/5 text-foreground/30 rounded px-1.5 py-0.5 text-[10px]">
                  flip: {config.flipDuration}s
                </span>
                <span className="bg-foreground/5 text-foreground/30 rounded px-1.5 py-0.5 text-[10px]">
                  suspense: {config.suspenseDuration}ms
                </span>
                {config.confettiCount > 0 && (
                  <span className="bg-foreground/5 text-foreground/30 rounded px-1.5 py-0.5 text-[10px]">
                    confetti: {config.confettiCount}
                  </span>
                )}
                {config.screenShake && (
                  <span className="bg-foreground/5 text-foreground/30 rounded px-1.5 py-0.5 text-[10px]">
                    shake
                  </span>
                )}
                {config.lightBeams && (
                  <span className="bg-foreground/5 text-foreground/30 rounded px-1.5 py-0.5 text-[10px]">
                    beams
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Animation preview area */}
      <div className="border-foreground/10 bg-surface-800/80 rounded-2xl border p-6">
        {activeTier && activeConfig ? (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-foreground text-lg font-semibold">
                Preview:{" "}
                <span className="text-green-400">{activeConfig.label}</span>
              </h2>
              <button
                onClick={handleReplay}
                className="bg-foreground/10 text-foreground hover:bg-foreground/20 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              >
                Replay
              </button>
            </div>

            <GambleReveal
              key={animKey}
              previousPlayer={mockPlayer(activeConfig.prevValue)}
              newPlayer={mockPlayer(activeConfig.newValue)}
              outcomeTier={activeConfig.tier}
              valueChange={activeConfig.newValue - activeConfig.prevValue}
              onComplete={handleComplete}
            />
          </>
        ) : (
          <div className="text-foreground/30 flex min-h-[420px] flex-col items-center justify-center gap-3">
            <span className="text-5xl">🎲</span>
            <p className="text-sm">Select an outcome tier above to preview</p>
          </div>
        )}
      </div>
    </div>
  );
}
