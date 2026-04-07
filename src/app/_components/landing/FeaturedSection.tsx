"use client";

import { motion } from "framer-motion";
import { cdnUrl } from "~/lib/cdn";

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const textVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

export function FeaturedSection() {
  return (
    <section className="relative min-h-[80vh] overflow-hidden">
      {/* Background Image with parallax-like effect */}
      <motion.div
        initial={{ scale: 1.15 }}
        whileInView={{ scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        viewport={{ once: true }}
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${cdnUrl("olympic-paris-nba.jpeg")})`,
        }}
      />
      {/* Gradient Overlay with gold tint */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/60 to-surface-950" />
      <div className="absolute inset-0 bg-gradient-to-t from-surface-950/90 via-transparent to-transparent" />

      {/* Decorative elements */}
      <div className="pointer-events-none absolute left-1/2 top-1/4 h-64 w-64 -translate-x-1/2 rounded-full bg-gold/10 blur-3xl" />

      {/* Content */}
      <motion.div 
        className="relative z-10 flex min-h-[80vh] flex-col items-center justify-center px-4 py-24 text-center sm:px-8 lg:px-16"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        <motion.h2 
          className="font-stencil text-4xl uppercase tracking-wide sm:text-5xl lg:text-7xl"
          variants={textVariants}
        >
          <span className="text-gradient-gold">Featured</span>
        </motion.h2>
        <motion.h2 
          className="font-stencil text-4xl uppercase tracking-wide text-foreground sm:text-5xl lg:text-7xl"
          variants={textVariants}
        >
          Lineups
        </motion.h2>

        <motion.div 
          className="mt-8 h-px w-48 bg-gradient-to-r from-transparent via-gold to-transparent"
          variants={textVariants}
        />

        <motion.p 
          className="mt-8 max-w-2xl text-lg leading-relaxed text-foreground/70"
          variants={textVariants}
        >
          Showcase your fantasy basketball prowess by sharing your lineups on
          social media or via text messages. Engage your friends and followers,
          and maybe even recruit some new competitors to join Lineup Legends.
        </motion.p>

        {/* CTA */}
        <motion.div className="mt-12" variants={textVariants}>
          <a
            href="/lineups/new"
            className="inline-block border-2 border-gold bg-gold/10 px-8 py-3 font-stencil text-sm uppercase tracking-wider text-foreground/90 transition-all hover:bg-gold hover:text-black hover:glow-gold-sm"
          >
            Build Your Lineup
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
}
