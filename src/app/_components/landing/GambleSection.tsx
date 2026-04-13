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
  hidden: { opacity: 0, scale: 0.95, x: 30 },
  visible: {
    opacity: 1,
    scale: 1,
    x: 0,
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

export function GambleSection() {
  return (
    <section className="bg-surface-950 relative overflow-hidden px-4 py-24 sm:px-8 lg:px-16">
      {/* Subtle gradient accent */}
      <div className="bg-gold/5 pointer-events-none absolute top-1/2 -right-64 h-96 w-96 -translate-y-1/2 rounded-full blur-3xl" />

      <div className="mx-auto flex max-w-7xl flex-col items-center gap-12 lg:flex-row">
        {/* Left - Text */}
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
            Gamble for a
          </motion.h2>
          <motion.h2
            className="font-stencil text-4xl tracking-wide uppercase sm:text-5xl lg:text-6xl"
            variants={textVariants}
          >
            <span className="text-gradient-gold">Player</span>
          </motion.h2>

          <motion.div
            className="from-gold mx-auto mt-6 h-px w-24 bg-gradient-to-r to-transparent lg:mx-0"
            variants={textVariants}
          />

          <motion.p
            className="text-foreground/70 mt-8 max-w-xl text-lg leading-relaxed"
            variants={textVariants}
          >
            Roll the dice on any position for a random replacement. A weighted
            probability system ties risk to reward — lower-value players carry
            higher risk but a real shot at a big upgrade, while higher-value
            players are safer bets. You only get one gamble per lineup, so make
            it count. An NBA 2K-inspired card reveal shows the outcome with
            tier-based animations and sound effects.
          </motion.p>
        </motion.div>

        {/* Right - Image */}
        <motion.div
          className="flex-1"
          variants={imageVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <div className="relative">
            {/* Glow effect behind image */}
            <div className="bg-gold/10 absolute -inset-4 rounded-xl blur-2xl" />
            <motion.img
              src={cdnUrl("jordan-cigar.jpg")}
              alt="Michael Jordan celebrating with a cigar"
              className="relative w-full rounded-lg shadow-2xl shadow-black/50"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
