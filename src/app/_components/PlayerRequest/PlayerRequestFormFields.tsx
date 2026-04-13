"use client";

import { ValuePicker } from "~/app/_components/common/ui/ValuePicker";
import {
  DuplicateHints,
  type DuplicateMatch,
} from "~/app/_components/PlayerRequest/DuplicateHints";

type PlayerRequestFormFieldsProps = {
  firstName: string;
  setFirstName: (v: string) => void;
  lastName: string;
  setLastName: (v: string) => void;
  suggestedValue: number;
  setSuggestedValue: (v: number) => void;
  note: string;
  setNote: (v: string) => void;
  duplicates?: DuplicateMatch[] | null;
  idPrefix?: string;
};

export function PlayerRequestFormFields({
  firstName,
  setFirstName,
  lastName,
  setLastName,
  suggestedValue,
  setSuggestedValue,
  note,
  setNote,
  duplicates,
  idPrefix = "req",
}: PlayerRequestFormFieldsProps) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor={`${idPrefix}FirstName`}
            className="text-foreground/80 mb-2 block text-sm font-medium"
          >
            First Name
          </label>
          <input
            type="text"
            id={`${idPrefix}FirstName`}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            placeholder="e.g. LeBron"
            className="border-foreground/20 bg-foreground/10 text-foreground placeholder-foreground/50 focus:border-gold focus:ring-gold w-full rounded-lg border px-4 py-2 focus:ring-1 focus:outline-none"
          />
        </div>
        <div>
          <label
            htmlFor={`${idPrefix}LastName`}
            className="text-foreground/80 mb-2 block text-sm font-medium"
          >
            Last Name
          </label>
          <input
            type="text"
            id={`${idPrefix}LastName`}
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
        <ValuePicker
          value={suggestedValue}
          onChange={setSuggestedValue}
          size="sm"
        />
      </div>

      <div>
        <label
          htmlFor={`${idPrefix}Note`}
          className="text-foreground/80 mb-2 block text-sm font-medium"
        >
          Note{" "}
          <span className="text-foreground/40 font-normal">(optional)</span>
        </label>
        <textarea
          id={`${idPrefix}Note`}
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
    </>
  );
}
