"use client";

import { motion } from "framer-motion";
import { VALUE_COLORS } from "./gamble-reveal-utils";

const NEUTRAL_COLOR = "#9ca3af";

interface MysteryCardProps {
  playerValue: number;
  suspenseDuration: number;
}

export function MysteryCard({ playerValue, suspenseDuration }: MysteryCardProps) {
  const tierColor = VALUE_COLORS[playerValue] ?? "#e3b920";

  const colorTransitionDelay = suspenseDuration * 0.45 / 1000;
  const colorTransitionDuration = suspenseDuration * 0.55 / 1000;

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      {/* Shimmer sweep overlay — starts neutral, shifts to tier color */}
      <motion.div
        className="absolute inset-0 overflow-hidden rounded-2xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <motion.div
          className="absolute -inset-full"
          initial={{
            background: `linear-gradient(105deg, transparent 40%, ${NEUTRAL_COLOR}22 45%, ${NEUTRAL_COLOR}44 50%, ${NEUTRAL_COLOR}22 55%, transparent 60%)`,
          }}
          animate={{
            background: `linear-gradient(105deg, transparent 40%, ${tierColor}22 45%, ${tierColor}44 50%, ${tierColor}22 55%, transparent 60%)`,
            x: ["-100%", "200%"],
          }}
          transition={{
            background: {
              delay: colorTransitionDelay,
              duration: colorTransitionDuration,
              ease: "easeInOut",
            },
            x: {
              duration: 2,
              repeat: Infinity,
              repeatDelay: 0.5,
              ease: "easeInOut",
            },
          }}
        />
      </motion.div>

      {/* Card face content */}
      <motion.div
        className="relative flex h-full w-full flex-col items-center justify-center rounded-2xl border border-white/10"
        initial={{
          background: `radial-gradient(ellipse at center, ${NEUTRAL_COLOR}15 0%, #0a0a0a 70%)`,
        }}
        animate={{
          background: `radial-gradient(ellipse at center, ${tierColor}15 0%, #0a0a0a 70%)`,
        }}
        transition={{
          delay: colorTransitionDelay,
          duration: colorTransitionDuration,
          ease: "easeInOut",
        }}
      >
        {/* Decorative border — neutral to tier */}
        <motion.div
          className="absolute inset-4 rounded-xl border"
          initial={{ borderColor: `${NEUTRAL_COLOR}30` }}
          animate={{ borderColor: `${tierColor}30` }}
          transition={{
            delay: colorTransitionDelay,
            duration: colorTransitionDuration,
            ease: "easeInOut",
          }}
        />

        {/* Question mark — neutral to tier color */}
        <motion.span
          className="select-none text-7xl font-black"
          initial={{
            color: NEUTRAL_COLOR,
            textShadow: `0 0 30px ${NEUTRAL_COLOR}80, 0 0 60px ${NEUTRAL_COLOR}40`,
          }}
          animate={{
            color: tierColor,
            textShadow: `0 0 30px ${tierColor}80, 0 0 60px ${tierColor}40`,
            scale: [1, 1.05, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            color: {
              delay: colorTransitionDelay,
              duration: colorTransitionDuration,
              ease: "easeInOut",
            },
            textShadow: {
              delay: colorTransitionDelay,
              duration: colorTransitionDuration,
              ease: "easeInOut",
            },
            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
            opacity: { duration: 2, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          ?
        </motion.span>

        {/* Dice icon */}
        <motion.span
          className="mt-4 text-2xl opacity-40"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          🎲
        </motion.span>
      </motion.div>
    </div>
  );
}
