"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";
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
            <HelpCircle className="text-gold h-5 w-5" />
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
              <ChevronDown
                className={`text-foreground/40 h-4 w-4 shrink-0 transition-transform duration-200 ${
                  openIndex === index ? "rotate-180" : ""
                }`}
              />
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
