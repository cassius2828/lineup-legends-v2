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
  hidden: { opacity: 0, x: -40 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.6, ease: "easeOut" as const },
  },
};

export function CommentingSection() {
  return (
    <section className="relative min-h-[70vh] overflow-hidden">
      {/* Background Image */}
      <motion.div
        initial={{ scale: 1.1 }}
        whileInView={{ scale: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        viewport={{ once: true }}
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${cdnUrl("inside-the-nba.jpg")})`,
        }}
      />
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/80 to-black/40" />
      
      {/* Gold accent line */}
      <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-transparent via-gold/50 to-transparent" />

      {/* Content */}
      <motion.div 
        className="relative z-10 flex min-h-[70vh] items-center px-4 py-24 sm:px-8 lg:px-16"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="max-w-xl">
          <motion.h2 
            className="font-stencil text-4xl uppercase tracking-wide text-white sm:text-5xl lg:text-6xl"
            variants={textVariants}
          >
            Commenting on
          </motion.h2>
          <motion.h2 
            className="font-stencil text-4xl uppercase tracking-wide sm:text-5xl lg:text-6xl"
            variants={textVariants}
          >
            <span className="text-gradient-gold">Posts</span>
          </motion.h2>

          <motion.div 
            className="mt-6 h-px w-24 bg-gradient-to-r from-gold to-transparent"
            variants={textVariants}
          />

          <motion.p 
            className="mt-8 text-lg leading-relaxed text-white/70"
            variants={textVariants}
          >
            Foster discussions and provide feedback by leaving comments on your
            friends' and other users' lineups. Share tips, praise great picks,
            or suggest improvements to help everyone build better lineups.
          </motion.p>
        </div>
      </motion.div>
    </section>
  );
}
