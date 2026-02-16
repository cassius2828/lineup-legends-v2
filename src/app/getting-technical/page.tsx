"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function GettingTechnicalPage() {
  const router = useRouter();

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 px-4">
      <motion.div
        className="w-full max-w-lg text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Builder Icon */}
        <motion.div
          className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-2xl border border-gold/20 bg-gold/10"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
        >
          <svg
            className="h-12 w-12 text-gold"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M11.42 15.17l-5.384-5.383a1.5 1.5 0 010-2.122L9.88 3.82a1.5 1.5 0 012.122 0l5.383 5.384m-5.965 5.965a1.5 1.5 0 01-2.122 0L3.454 9.325a1.5 1.5 0 010-2.122m5.965 5.965L15.17 7.42m0 0l2.122 2.121m-2.122-2.121L18.07 4.6a1.5 1.5 0 012.122 0l1.414 1.414a1.5 1.5 0 010 2.122l-2.828 2.828"
            />
          </svg>
        </motion.div>

        {/* Heading */}
        <h1 className="font-stencil mb-4 text-4xl uppercase tracking-wide text-gradient-gold sm:text-5xl">
          Coming Soon
        </h1>

        {/* Description */}
        <p className="mx-auto mb-2 max-w-md text-lg text-white/70">
          We&apos;re working on a deep dive into the features and technical
          engineering behind Lineup Legends.
        </p>
        <p className="mx-auto mb-10 max-w-md text-sm text-white/50">
          This page will break down the app&apos;s architecture, explain how key
          features work under the hood, and highlight the programming and
          engineering decisions that power the experience.
        </p>

        {/* Navigation Buttons */}
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button
            onClick={() => router.back()}
            className="w-full cursor-pointer rounded-lg border border-white/20 bg-transparent px-6 py-3 text-sm font-medium text-white/90 transition-all hover:border-gold/50 hover:bg-gold/10 hover:text-white sm:w-auto"
          >
            Go Back
          </button>
          <Link
            href="/"
            className="w-full rounded-lg border-2 border-gold bg-gold/10 px-6 py-3 text-center text-sm font-medium text-white/90 transition-all hover:bg-gold hover:glow-gold-sm sm:w-auto"
          >
            Go Home
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
