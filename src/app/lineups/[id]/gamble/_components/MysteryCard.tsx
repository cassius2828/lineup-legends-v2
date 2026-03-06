"use client";

import { motion } from "framer-motion";
import { VALUE_COLORS } from "./gamble-reveal-utils";

interface MysteryCardProps {
  playerValue: number;
}

export function MysteryCard({ playerValue }: MysteryCardProps) {
  const glowColor = VALUE_COLORS[playerValue] ?? "#e3b920";

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      {/* Shimmer sweep overlay */}
      <motion.div
        className="absolute inset-0 overflow-hidden rounded-2xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <motion.div
          className="absolute -inset-full"
          style={{
            background: `linear-gradient(105deg, transparent 40%, ${glowColor}22 45%, ${glowColor}44 50%, ${glowColor}22 55%, transparent 60%)`,
          }}
          animate={{ x: ["-100%", "200%"] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 0.5,
            ease: "easeInOut",
          }}
        />
      </motion.div>

      {/* Card face content */}
      <div
        className="relative flex h-full w-full flex-col items-center justify-center rounded-2xl border border-white/10"
        style={{
          background: `radial-gradient(ellipse at center, ${glowColor}15 0%, #0a0a0a 70%)`,
        }}
      >
        {/* Decorative lines */}
        <div
          className="absolute inset-4 rounded-xl border"
          style={{ borderColor: `${glowColor}30` }}
        />

        {/* Question mark */}
        <motion.span
          className="select-none text-7xl font-black"
          style={{
            color: glowColor,
            textShadow: `0 0 30px ${glowColor}80, 0 0 60px ${glowColor}40`,
          }}
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          ?
        </motion.span>

        {/* Bottom dice icon */}
        <motion.span
          className="mt-4 text-2xl opacity-40"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          🎲
        </motion.span>
      </div>
    </div>
  );
}
