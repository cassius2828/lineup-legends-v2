"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { cdnUrl } from "~/lib/cdn";

interface HeroSectionProps {
  isAuthenticated: boolean;
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.3,
    },
  },
};

const titleVariants = {
  hidden: {
    opacity: 0,
    y: 60,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

const fadeUpVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" as const },
  },
};

const buttonContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const buttonVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

export function HeroSection({ isAuthenticated }: HeroSectionProps) {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Background Image - Mobile (Kobe dunk) */}
      <motion.div
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute inset-0 bg-cover bg-center bg-no-repeat md:hidden"
        style={{
          backgroundImage: `url(${cdnUrl("kobe-dwight-dunk.jpg")})`,
        }}
      />
      {/* Background Image - Desktop (Jordan vs LeBron) */}
      <motion.div
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute inset-0 hidden bg-cover bg-center bg-no-repeat md:block"
        style={{
          backgroundImage: `url(${cdnUrl("jordan-vs-lebron.png")})`,
        }}
      />

      {/* Dark Overlay with gold tint */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-slate-900" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />

      {/* Content */}
      <motion.div
        className="relative z-10 flex flex-col items-center px-4 text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Animated Title */}
        <motion.h1
          className="font-stencil text-6xl tracking-wider text-white uppercase sm:text-8xl md:text-9xl"
          variants={titleVariants}
        >
          Lineup
        </motion.h1>
        <motion.h1
          className="font-stencil -mt-2 text-6xl tracking-wider uppercase sm:-mt-4 sm:text-8xl md:text-9xl"
          variants={titleVariants}
        >
          <span className="text-gradient-gold">Legends</span>
        </motion.h1>

        {/* Tagline */}
        <motion.p
          className="mt-8 max-w-md text-lg text-white/80 sm:text-xl"
          variants={fadeUpVariants}
        >
          Build. Share. Dominate.
        </motion.p>

        {/* Decorative Line */}
        <motion.div
          className="via-gold mt-6 h-px w-32 bg-gradient-to-r from-transparent to-transparent"
          variants={fadeUpVariants}
        />

        {/* Buttons */}
        <motion.div
          className="mt-10 flex flex-col gap-4 sm:flex-row"
          variants={buttonContainerVariants}
        >
          {isAuthenticated ? (
            <motion.div variants={buttonVariants}>
              <Link
                href="/lineups/new"
                className="group border-gold bg-gold/10 font-stencil hover:bg-gold hover:glow-gold relative inline-block overflow-hidden rounded-none border-2 px-10 py-4 text-lg tracking-wide text-white uppercase transition-all duration-300"
              >
                <span className="relative z-10">Create Now</span>
              </Link>
            </motion.div>
          ) : (
            <>
              <motion.div variants={buttonVariants}>
                <Link
                  href="/api/auth/signin"
                  className="font-stencil inline-block rounded-none border-2 border-white/60 bg-white/5 px-10 py-4 text-lg tracking-wide text-white uppercase backdrop-blur-sm transition-all duration-300 hover:border-white hover:bg-white hover:text-black"
                >
                  Sign Up
                </Link>
              </motion.div>
              <motion.div variants={buttonVariants}>
                <Link
                  href="/api/auth/signin"
                  className="border-gold bg-gold font-stencil hover:glow-gold inline-block rounded-none border-2 px-10 py-4 text-lg tracking-wide text-black uppercase transition-all duration-300 hover:bg-white"
                >
                  Sign In
                </Link>
              </motion.div>
            </>
          )}
        </motion.div>
      </motion.div>

      {/* Scroll Indicator with pulsing glow */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.6 }}
      >
        <motion.div
          animate={{
            y: [0, 8, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative"
        >
          <div className="bg-gold/20 absolute inset-0 animate-pulse rounded-full blur-xl" />
          <svg
            className="text-gold relative h-8 w-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </motion.div>
      </motion.div>

      {/* Subtle corner accents */}
      <div className="from-gold/40 pointer-events-none absolute top-24 left-8 h-32 w-px bg-gradient-to-b to-transparent" />
      <div className="from-gold/40 pointer-events-none absolute top-24 left-8 h-px w-32 bg-gradient-to-r to-transparent" />
      <div className="from-gold/40 pointer-events-none absolute top-24 right-8 h-32 w-px bg-gradient-to-b to-transparent" />
      <div className="from-gold/40 pointer-events-none absolute top-24 right-8 h-px w-32 bg-gradient-to-l to-transparent" />
    </section>
  );
}
