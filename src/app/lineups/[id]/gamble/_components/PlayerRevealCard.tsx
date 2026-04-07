"use client";

import { motion } from "framer-motion";
import { PlayerImage } from "~/app/_components/PlayerImage";
import type { PlayerOutput, GambleOutcomeTier } from "~/server/api/schemas/output";
import {
  VALUE_COLORS,
  VALUE_LABELS,
  getOutcomeCategory,
  type TierAnimationConfig,
} from "./gamble-reveal-utils";

interface PlayerRevealCardProps {
  player: PlayerOutput;
  valueChange: number;
  outcomeTier: GambleOutcomeTier;
  config: TierAnimationConfig;
  showCelebration: boolean;
}

export function PlayerRevealCard({
  player,
  valueChange,
  outcomeTier,
  config,
  showCelebration,
}: PlayerRevealCardProps) {
  const tierColor = VALUE_COLORS[player.value] ?? "#e3b920";
  const tierLabel = VALUE_LABELS[player.value] ?? "";
  const category = getOutcomeCategory(outcomeTier);

  const badgeColor =
    category === "positive"
      ? "bg-emerald-500"
      : category === "negative"
        ? "bg-red-500"
        : "bg-white/20";

  const badgeSign = valueChange > 0 ? "+" : "";

  const isDisaster = outcomeTier === "disaster" || outcomeTier === "big_loss";

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-2xl">
      {/* Light beams (positive outcomes only) */}
      {config.lightBeams && showCelebration && (
        <div className="absolute inset-0 flex items-center justify-center">
          {Array.from({ length: config.glowIntensity === 3 ? 12 : 6 }).map(
            (_, i, arr) => (
              <motion.div
                key={i}
                className="absolute h-[200%] w-1"
                style={{
                  background: `linear-gradient(to top, transparent, ${tierColor}60, transparent)`,
                  transformOrigin: "center center",
                  rotate: `${(360 / arr.length) * i}deg`,
                }}
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{ scaleY: 1, opacity: [0, 0.8, 0.3] }}
                transition={{
                  duration: 1.2,
                  delay: i * 0.05,
                  ease: "easeOut",
                }}
              />
            ),
          )}
        </div>
      )}

      {/* Expanding ring (positive outcomes) */}
      {config.lightBeams && showCelebration && (
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 120,
            height: 120,
            border: `2px solid ${tierColor}`,
            boxShadow: `0 0 20px ${tierColor}60`,
          }}
          initial={{ scale: 0.8, opacity: 1 }}
          animate={{ scale: 3, opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      )}

      {/* Card content */}
      <div
        className="relative flex h-full w-full flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 sm:gap-3"
        style={{
          background: `radial-gradient(ellipse at center, ${category === "negative" ? "#ef444420" : tierColor + "20"} 0%, #0a0a0a 70%)`,
        }}
      >
        {/* Tier label */}
        <motion.span
          className="text-[10px] font-bold tracking-widest uppercase sm:text-xs"
          style={{ color: tierColor }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {tierLabel}
        </motion.span>

        {/* Player image */}
        <motion.div
          className="relative h-20 w-20 overflow-hidden rounded-full sm:h-24 sm:w-24"
          style={{
            boxShadow: `0 0 ${config.glowIntensity * 12}px ${config.glowIntensity * 4}px ${category === "negative" ? "#ef4444" : tierColor}`,
          }}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{
            scale: 1,
            opacity: showCelebration && isDisaster ? 0.6 : 1,
          }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 15,
            delay: 0.1,
          }}
        >
          <PlayerImage
            imgUrl={player.imgUrl}
            alt={`${player.firstName} ${player.lastName}`}
            className="absolute inset-0 h-full w-full rounded-full object-cover"
          />
        </motion.div>

        {/* Player name */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-base font-bold text-white sm:text-lg">
            {player.firstName} {player.lastName}
          </p>
          <p className="text-xs font-semibold sm:text-sm" style={{ color: tierColor }}>
            ${player.value}
          </p>
        </motion.div>

        {/* Value change badge */}
        {showCelebration && valueChange !== 0 && (
          <motion.div
            className={`${badgeColor} rounded-full px-3 py-0.5 text-xs font-bold text-white sm:px-4 sm:py-1 sm:text-sm`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 10,
              delay: 0.5,
            }}
          >
            {badgeSign}
            {valueChange}
          </motion.div>
        )}

        {/* Neutral badge */}
        {showCelebration && valueChange === 0 && (
          <motion.div
            className="rounded-full bg-white/10 px-3 py-0.5 text-xs font-medium text-white/70 sm:px-4 sm:py-1 sm:text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Same value
          </motion.div>
        )}
      </div>

      {/* Red flash for negative outcomes */}
      {showCelebration && category === "negative" && (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            background: `radial-gradient(ellipse at center, rgba(239,68,68,${isDisaster ? "0.4" : "0.25"}) 0%, transparent 70%)`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.4] }}
          transition={{ duration: 0.8, times: [0, 0.3, 1] }}
        />
      )}

      {/* Diagonal crack lines for disaster */}
      {showCelebration && outcomeTier === "disaster" && (
        <>
          <motion.div
            className="pointer-events-none absolute left-1/4 top-0 h-full w-px origin-top"
            style={{
              background:
                "linear-gradient(to bottom, transparent 10%, rgba(239,68,68,0.6) 40%, rgba(239,68,68,0.6) 60%, transparent 90%)",
              transform: "rotate(15deg)",
            }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          />
          <motion.div
            className="pointer-events-none absolute right-1/3 top-0 h-full w-px origin-top"
            style={{
              background:
                "linear-gradient(to bottom, transparent 20%, rgba(239,68,68,0.5) 45%, rgba(239,68,68,0.5) 70%, transparent 95%)",
              transform: "rotate(-10deg)",
            }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.4, delay: 0.35 }}
          />
        </>
      )}
    </div>
  );
}
