"use client";

import { motion } from "framer-motion";
import { Button } from "~/app/_components/common/ui/Button";
import { PlayerRequestFormFields } from "~/app/_components/PlayerRequest/PlayerRequestFormFields";
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
        <PlayerRequestFormFields
          firstName={firstName}
          setFirstName={setFirstName}
          lastName={lastName}
          setLastName={setLastName}
          suggestedValue={suggestedValue}
          setSuggestedValue={setSuggestedValue}
          note={note}
          setNote={setNote}
          duplicates={duplicates}
          idPrefix="req"
        />

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
