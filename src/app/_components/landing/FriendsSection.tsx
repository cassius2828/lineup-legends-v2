"use client";

import { motion } from "framer-motion";
import { cdnUrl } from "~/lib/cdn";

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const textVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" as const },
  },
};

const imageVariants = {
  hidden: { opacity: 0, scale: 0.95, x: -30 },
  visible: {
    opacity: 1,
    scale: 1,
    x: 0,
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

export function FriendsSection() {
  return (
    <section className="bg-background relative overflow-hidden px-4 py-24 sm:px-8 lg:px-16">
      {/* Subtle gradient accent */}
      <div className="bg-gold/5 pointer-events-none absolute top-1/2 -left-64 h-96 w-96 -translate-y-1/2 rounded-full blur-3xl" />

      <div className="mx-auto flex max-w-7xl flex-col items-center gap-12 lg:flex-row">
        {/* Left - Image */}
        <motion.div
          className="flex-1"
          variants={imageVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.img
            src={cdnUrl("magic-and-bird-friends.jpeg")}
            alt="Larry Bird and Magic Johnson shaking hands"
            className="w-full rounded-lg shadow-2xl shadow-black/50"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
          />
        </motion.div>

        {/* Right - Text */}
        <motion.div
          className="flex-1 text-center lg:text-left"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.h2
            className="font-stencil text-foreground text-4xl tracking-wide uppercase sm:text-5xl lg:text-6xl"
            variants={textVariants}
          >
            Follow <span className="text-gradient-gold">Players</span>
          </motion.h2>

          <motion.div
            className="from-gold mx-auto mt-6 h-px w-24 bg-gradient-to-r to-transparent lg:mx-0"
            variants={textVariants}
          />

          <motion.p
            className="text-foreground/70 mt-8 max-w-xl text-lg leading-relaxed"
            variants={textVariants}
          >
            Search for other users, follow them, and keep up with their latest
            lineups. Customize your own profile with a banner, avatar, and bio —
            then check out your lineup stats, featured creations, and follower
            count all in one place.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
