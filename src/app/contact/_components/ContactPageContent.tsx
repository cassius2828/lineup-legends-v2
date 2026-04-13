"use client";

import { motion } from "framer-motion";
import { containerVariants, sectionVariants } from "../_lib/motionVariants";
import { ConnectSection } from "./ConnectSection";
import { FAQSection } from "./FAQSection";
import { FeedbackSection } from "./FeedbackSection";
import { PlayerRequestSection } from "./PlayerRequestSection";

/**
 * Contact hub: player requests + social links (left), feedback form + FAQs (right).
 * Section-level animation variants live in `_lib/motionVariants.ts`.
 */
export function ContactPageContent() {
  return (
    <main className="from-surface-950 via-surface-800 to-surface-950 min-h-screen bg-gradient-to-b">
      {/* Staggered fade-in for children (see containerVariants) */}
      <motion.div
        className="container mx-auto px-4 py-12"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Page title + blurb */}
        <motion.div className="mb-12 text-center" variants={sectionVariants}>
          <h1 className="font-stencil text-gradient-gold text-4xl tracking-wide uppercase sm:text-5xl">
            Contact Us
          </h1>
          <p className="text-foreground/60 mx-auto mt-4 max-w-2xl text-lg">
            Request new players, share your feedback, or get in touch with the
            developer.
          </p>
        </motion.div>

        {/* lg: two columns; stacked on small screens */}
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
          {/* Column 1 — submissions & outbound links */}
          <div className="space-y-8">
            <PlayerRequestSection />
            <ConnectSection />
          </div>

          {/* Column 2 — feedback + help */}
          <div className="space-y-8">
            <FeedbackSection />
            <FAQSection />
          </div>
        </div>
      </motion.div>
    </main>
  );
}
