"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { PlayerOutput, GambleOutcomeTier } from "~/server/api/schemas/output";
import { PlayerImage } from "~/app/_components/PlayerImage";
import { MysteryCard } from "./MysteryCard";
import { PlayerRevealCard } from "./PlayerRevealCard";
import { RevealParticles } from "./RevealParticles";
import {
  VALUE_COLORS,
  getOutcomeCategory,
  getTierConfig,
  type AnimationPhase,
} from "./gamble-reveal-utils";
import { useGambleSounds } from "./useGambleSounds";

interface GambleRevealProps {
  previousPlayer: PlayerOutput;
  newPlayer: PlayerOutput;
  outcomeTier: GambleOutcomeTier;
  valueChange: number;
  onComplete: () => void;
}

export function GambleReveal({
  previousPlayer,
  newPlayer,
  outcomeTier,
  valueChange,
  onComplete,
}: GambleRevealProps) {
  const [phase, setPhase] = useState<AnimationPhase>("suspense");
  const [showCelebration, setShowCelebration] = useState(false);

  const config = getTierConfig(outcomeTier);
  const category = getOutcomeCategory(outcomeTier);
  const tierColor = VALUE_COLORS[newPlayer.value] ?? "#e3b920";
  const { playSuspense, stopSuspense, playFlip, playCelebration } =
    useGambleSounds(outcomeTier);

  const skip = useCallback(() => {
    stopSuspense();
    setPhase("done");
    onComplete();
  }, [onComplete, stopSuspense]);

  useEffect(() => {
    if (phase === "suspense") {
      playSuspense();
      const timer = setTimeout(
        () => setPhase("reveal"),
        config.suspenseDuration,
      );
      return () => clearTimeout(timer);
    }
  }, [phase, config.suspenseDuration, playSuspense]);

  useEffect(() => {
    if (phase === "reveal") {
      stopSuspense();
      playFlip();
      const flipMs = config.flipDuration * 1000 + 200;
      const timer = setTimeout(() => {
        setPhase("celebration");
        setShowCelebration(true);
      }, flipMs);
      return () => clearTimeout(timer);
    }
  }, [phase, config.flipDuration, stopSuspense, playFlip]);

  useEffect(() => {
    if (phase === "celebration") {
      playCelebration();
      const timer = setTimeout(() => {
        setPhase("done");
        onComplete();
      }, 2800);
      return () => clearTimeout(timer);
    }
  }, [phase, onComplete, playCelebration]);

  const isFlipped =
    phase === "reveal" || phase === "celebration" || phase === "done";

  const trembleKeyframes =
    config.glowIntensity >= 3
      ? [0, -1, 1, -1, 0]
      : config.glowIntensity >= 2
        ? [0, -0.5, 0.5, 0]
        : [0];

  const trembleTransition =
    config.glowIntensity >= 3
      ? { duration: 0.15, repeat: Infinity, repeatDelay: 0.8 }
      : config.glowIntensity >= 2
        ? { duration: 0.2, repeat: Infinity, repeatDelay: 1.2 }
        : {};

  return (
    <div className="relative flex min-h-[380px] flex-col items-center justify-center sm:min-h-[420px]">
      {/* Background pulse for positive outcomes */}
      <AnimatePresence>
        {phase === "celebration" && category === "positive" && (
          <motion.div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at center, ${tierColor}15 0%, transparent 70%)`,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.5] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
          />
        )}
      </AnimatePresence>

      {/* Screen shake wrapper */}
      <motion.div
        className="flex flex-col items-center"
        animate={
          phase === "celebration" && config.screenShake
            ? {
              x: [0, -4, 5, -3, 4, -2, 0],
              y: [0, 3, -4, 3, -2, 1, 0],
            }
            : phase === "celebration" && category === "negative"
              ? { x: [0, -2, 2, -1, 0] }
              : {}
        }
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        {/* Outcome label */}
        <AnimatePresence>
          {phase === "celebration" && (
            <motion.div
              className="mb-4"
              initial={{ opacity: 0, y: -20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 12 }}
            >
              <span
                className="text-base font-black tracking-wider uppercase sm:text-lg"
                style={{
                  color:
                    category === "positive"
                      ? tierColor
                      : category === "negative"
                        ? "#ef4444"
                        : "#9ca3af",
                  textShadow:
                    category === "positive"
                      ? `0 0 20px ${tierColor}60`
                      : category === "negative"
                        ? "0 0 20px rgba(239,68,68,0.4)"
                        : undefined,
                }}
              >
                {getOutcomeLabel(outcomeTier)}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Card container with perspective */}
        <motion.div
          className="relative"
          style={{ perspective: 1200 }}
          animate={
            phase === "suspense"
              ? { y: [0, -8, 0], x: trembleKeyframes }
              : {}
          }
          transition={
            phase === "suspense"
              ? {
                y: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                x: trembleTransition,
              }
              : {}
          }
        >
          {/* Outer glow ring — starts neutral, transitions to tier color */}
          <motion.div
            className="absolute -inset-3 rounded-3xl"
            initial={{
              boxShadow: `0 0 15px 5px #9ca3af40`,
            }}
            animate={
              phase === "suspense"
                ? {
                  boxShadow: [
                    `0 0 15px 5px #9ca3af40`,
                    `0 0 30px 12px #9ca3af60`,
                    `0 0 20px 8px ${tierColor}50`,
                    `0 0 30px 12px ${tierColor}70`,
                    `0 0 15px 5px ${tierColor}40`,
                  ],
                }
                : {
                  boxShadow: `0 0 ${config.glowIntensity * 20}px ${config.glowIntensity * 8}px ${category === "negative" && isFlipped ? "#ef444480" : tierColor + "80"}`,
                }
            }
            transition={
              phase === "suspense"
                ? {
                  duration: config.suspenseDuration / 1000,
                  ease: "easeInOut",
                }
                : { duration: 0.4 }
            }
          />

          {/* 3D flip card */}
          <motion.div
            className="relative h-64 w-44 sm:h-72 sm:w-52"
            style={{ transformStyle: "preserve-3d" }}
            animate={{
              rotateY: isFlipped ? 180 : 0,
              scale:
                phase === "celebration" && category === "negative"
                  ? 0.95
                  : 1,
            }}
            transition={{
              rotateY: {
                duration: config.flipDuration,
                ease: [0.34, 1.56, 0.64, 1],
              },
              scale: { duration: 0.3 },
            }}
          >
            {/* Front face (mystery) */}
            <div
              className="absolute inset-0"
              style={{ backfaceVisibility: "hidden" }}
            >
              <MysteryCard playerValue={newPlayer.value} suspenseDuration={config.suspenseDuration} />
            </div>

            {/* Back face (player reveal) */}
            <div
              className="absolute inset-0"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              <PlayerRevealCard
                player={newPlayer}
                valueChange={valueChange}
                outcomeTier={outcomeTier}
                config={config}
                showCelebration={showCelebration}
              />
            </div>
          </motion.div>
        </motion.div>

        {/* Previous player comparison (celebration phase) */}
        <AnimatePresence>
          {phase === "celebration" && (
            <motion.div
              className="mt-5 flex items-center gap-3 sm:mt-6 sm:gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex items-center gap-2 text-xs text-white/50 sm:text-sm">
                <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full opacity-50 grayscale sm:h-8 sm:w-8">
                  <PlayerImage
                    imgUrl={previousPlayer.imgUrl}
                    alt={previousPlayer.firstName}
                    className="h-full w-full object-cover"
                  />
                </div>
                <span className="line-through">
                  {previousPlayer.firstName} (${previousPlayer.value})
                </span>
                <span className="text-base text-white/30 sm:text-lg">→</span>
                <span className="font-semibold" style={{ color: tierColor }}>
                  {newPlayer.firstName} (${newPlayer.value})
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Confetti particles */}
      <RevealParticles
        playerValue={newPlayer.value}
        outcomeTier={outcomeTier}
        fire={phase === "celebration"}
      />

      {/* Skip button */}
      {phase !== "done" && (
        <motion.button
          className="absolute right-0 bottom-0 rounded-lg px-4 py-2 text-xs text-white/30 transition-colors hover:text-white/60"
          onClick={skip}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Skip →
        </motion.button>
      )}
    </div>
  );
}

function getOutcomeLabel(tier: GambleOutcomeTier): string {
  switch (tier) {
    case "jackpot":
      return "JACKPOT!";
    case "big_win":
      return "BIG WIN!";
    case "upgrade":
      return "UPGRADE!";
    case "neutral":
      return "EVEN SWAP";
    case "downgrade":
      return "DOWNGRADE";
    case "big_loss":
      return "BIG LOSS";
    case "disaster":
      return "DISASTER";
  }
}
