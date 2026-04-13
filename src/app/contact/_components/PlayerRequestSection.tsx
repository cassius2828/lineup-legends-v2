"use client";

import { motion } from "framer-motion";
import { Button } from "~/app/_components/common/ui/Button";
import { DuplicateHints } from "~/app/_components/PlayerRequest/DuplicateHints";
import { sectionVariants } from "../_lib/motionVariants";
import { usePlayerRequestSection } from "../_hooks/usePlayerRequestSection";

export function PlayerRequestSection() {
  const {
    firstName,
    setFirstName,
    lastName,
    setLastName,
    suggestedValue,
    setSuggestedValue,
    note,
    setNote,
    duplicates,
    createRequest,
    handleSubmit,
  } = usePlayerRequestSection();

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
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
          <h2 className="text-foreground text-xl font-semibold">
            Request a Player
          </h2>
        </div>
        <p className="text-foreground/60 text-sm">
          Can&apos;t find the player you&apos;re looking for? Submit a request
          and we&apos;ll work on adding them to the database.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="reqFirstName"
              className="text-foreground/80 mb-2 block text-sm font-medium"
            >
              First Name
            </label>
            <input
              type="text"
              id="reqFirstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              placeholder="e.g. LeBron"
              className="border-foreground/20 bg-foreground/10 text-foreground placeholder-foreground/50 focus:border-gold focus:ring-gold w-full rounded-lg border px-4 py-2 focus:ring-1 focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="reqLastName"
              className="text-foreground/80 mb-2 block text-sm font-medium"
            >
              Last Name
            </label>
            <input
              type="text"
              id="reqLastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              placeholder="e.g. James"
              className="border-foreground/20 bg-foreground/10 text-foreground placeholder-foreground/50 focus:border-gold focus:ring-gold w-full rounded-lg border px-4 py-2 focus:ring-1 focus:outline-none"
            />
          </div>
        </div>

        {duplicates && duplicates.length > 0 && (
          <DuplicateHints duplicates={duplicates} />
        )}

        <div>
          <label className="text-foreground/80 mb-2 block text-sm font-medium">
            Suggested Value ($1-$5)
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setSuggestedValue(v)}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                  suggestedValue === v
                    ? "bg-gold text-black"
                    : "bg-foreground/10 text-foreground hover:bg-foreground/20"
                }`}
              >
                ${v}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label
            htmlFor="reqNote"
            className="text-foreground/80 mb-2 block text-sm font-medium"
          >
            Note{" "}
            <span className="text-foreground/40 font-normal">(optional)</span>
          </label>
          <textarea
            id="reqNote"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Why do you want this player?"
            className="border-foreground/20 bg-foreground/10 text-foreground placeholder-foreground/50 focus:border-gold focus:ring-gold w-full resize-none rounded-lg border px-4 py-2 focus:ring-1 focus:outline-none"
          />
          <p className="text-foreground/40 mt-1 text-right text-xs">
            {note.length}/500
          </p>
        </div>

        <Button
          type="submit"
          color="gold"
          variant="solid"
          loading={createRequest.isPending}
          loadingText="Submitting..."
          className="w-full px-6 py-2.5 font-semibold"
        >
          Submit Request
        </Button>
      </form>
    </motion.section>
  );
}
