"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FAQ_ITEMS } from "../_lib/faqItems";
import { sectionVariants } from "../_lib/motionVariants";

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <motion.section
      className="border-foreground/10 bg-foreground/5 rounded-xl border p-6 backdrop-blur-sm"
      variants={sectionVariants}
    >
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-3">
          <div className="bg-gold/20 flex h-10 w-10 items-center justify-center rounded-lg">
            <svg
              className="text-gold h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-foreground text-xl font-semibold">FAQs</h2>
        </div>
        <p className="text-foreground/60 text-sm">
          Common questions about how Lineup Legends works.
        </p>
      </div>

      <div className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
        {FAQ_ITEMS.map((item, index) => (
          <div key={index} className="border-foreground/10 rounded-lg border">
            <button
              type="button"
              onClick={() => toggle(index)}
              className="text-foreground hover:bg-foreground/5 flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left text-sm font-medium transition-colors"
            >
              <span className="pr-4">{item.question}</span>
              <svg
                className={`text-foreground/40 h-4 w-4 shrink-0 transition-transform duration-200 ${
                  openIndex === index ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {openIndex === index && (
              <div className="text-foreground/60 border-foreground/10 border-t px-4 py-3 text-sm leading-relaxed">
                {item.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </motion.section>
  );
}
