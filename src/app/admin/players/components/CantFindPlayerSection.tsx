"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api } from "~/trpc/react";
import { DuplicateHints } from "~/app/_components/PlayerRequest/DuplicateHints";

interface CantFindPlayerSectionProps {
  showRequestForm: boolean;
  setShowRequestForm: (show: boolean) => void;
  requestSuccess: boolean;
  requestError: string;
  requestFirstName: string;
  setRequestFirstName: (firstName: string) => void;
  requestLastName: string;
  setRequestLastName: (lastName: string) => void;
  requestValue: number;
  setRequestValue: (value: number) => void;
  requestNote: string;
  setRequestNote: (note: string) => void;
  createRequest: { isPending: boolean };
  handleRequestSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  setRequestError: (error: string) => void;
}

export const CantFindPlayerSection = ({
  showRequestForm,
  setShowRequestForm,
  requestSuccess,
  requestError,
  requestFirstName,
  setRequestFirstName,
  requestLastName,
  setRequestLastName,
  requestValue,
  setRequestValue,
  requestNote,
  setRequestNote,
  createRequest,
  handleRequestSubmit,
  setRequestError,
}: CantFindPlayerSectionProps) => {
  const [debouncedFirst, setDebouncedFirst] = useState("");
  const [debouncedLast, setDebouncedLast] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (
      requestFirstName.trim().length >= 2 &&
      requestLastName.trim().length >= 2
    ) {
      timerRef.current = setTimeout(() => {
        setDebouncedFirst(requestFirstName.trim());
        setDebouncedLast(requestLastName.trim());
      }, 2000);
    } else {
      setDebouncedFirst("");
      setDebouncedLast("");
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [requestFirstName, requestLastName]);

  const { data: duplicates } = api.requestedPlayer.searchDuplicates.useQuery(
    { firstName: debouncedFirst, lastName: debouncedLast },
    { enabled: debouncedFirst.length >= 2 && debouncedLast.length >= 2 },
  );

  return (
    <div className="border-foreground/10 bg-foreground/5 mt-12 rounded-lg border p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground text-lg font-semibold">
            Can&apos;t find the player you&apos;re looking for?
          </h2>
          <p className="text-foreground/60 mt-1 text-sm">
            Submit a request to add a new player to the database
          </p>
        </div>
        {!showRequestForm && (
          <button
            onClick={() => setShowRequestForm(true)}
            className="bg-gold hover:bg-gold-light rounded-lg px-6 py-2 font-semibold text-black transition-colors"
          >
            Request Player
          </button>
        )}
      </div>

      {showRequestForm && (
        <form onSubmit={handleRequestSubmit} className="mt-6 space-y-4">
          {requestSuccess && (
            <div className="bg-gold-500/20 text-gold-300 rounded-lg p-3 text-sm">
              Player request submitted successfully!
            </div>
          )}

          {requestError && (
            <div className="rounded-lg bg-red-500/20 p-3 text-sm text-red-400">
              {requestError}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="requestFirstName"
                className="text-foreground/80 mb-2 block text-sm font-medium"
              >
                First Name
              </label>
              <input
                type="text"
                id="requestFirstName"
                value={requestFirstName}
                onChange={(e) => setRequestFirstName(e.target.value)}
                required
                placeholder="e.g. LeBron"
                className="focus:border-gold focus:ring-gold border-foreground/20 bg-foreground/10 text-foreground placeholder-foreground/50 w-full rounded-lg border px-4 py-2 focus:ring-1 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="requestLastName"
                className="text-foreground/80 mb-2 block text-sm font-medium"
              >
                Last Name
              </label>
              <input
                type="text"
                id="requestLastName"
                value={requestLastName}
                onChange={(e) => setRequestLastName(e.target.value)}
                required
                placeholder="e.g. James"
                className="focus:border-gold focus:ring-gold border-foreground/20 bg-foreground/10 text-foreground placeholder-foreground/50 w-full rounded-lg border px-4 py-2 focus:ring-1 focus:outline-none"
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
                  onClick={() => setRequestValue(v)}
                  className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                    requestValue === v
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
              htmlFor="adminReqNote"
              className="text-foreground/80 mb-2 block text-sm font-medium"
            >
              Note{" "}
              <span className="text-foreground/40 font-normal">(optional)</span>
            </label>
            <textarea
              id="adminReqNote"
              value={requestNote}
              onChange={(e) => setRequestNote(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Why do you want this player?"
              className="focus:border-gold focus:ring-gold border-foreground/20 bg-foreground/10 text-foreground placeholder-foreground/50 w-full resize-none rounded-lg border px-4 py-2 focus:ring-1 focus:outline-none"
            />
            <p className="text-foreground/40 mt-1 text-right text-xs">
              {requestNote.length}/500
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={createRequest.isPending}
              className="bg-gold hover:bg-gold-light rounded-lg px-6 py-2 font-semibold text-black transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createRequest.isPending ? "Submitting..." : "Submit Request"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowRequestForm(false);
                setRequestError("");
              }}
              className="bg-foreground/10 text-foreground hover:bg-foreground/20 rounded-lg px-6 py-2 font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="border-foreground/10 mt-4 border-t pt-4">
        <Link
          href="/admin/requested"
          className="text-foreground/60 hover:text-foreground/80 text-sm"
        >
          View all player requests &rarr;
        </Link>
      </div>
    </div>
  );
};
