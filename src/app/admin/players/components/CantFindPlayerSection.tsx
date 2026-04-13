"use client";

import { useState } from "react";
import Link from "next/link";
import { usePlayerRequest } from "~/app/_hooks/usePlayerRequest";
import { PlayerRequestFormFields } from "~/app/_components/PlayerRequest/PlayerRequestFormFields";

export function CantFindPlayerSection() {
  const [showForm, setShowForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

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
  } = usePlayerRequest({
    onSuccess: () => {
      setSuccessMsg("Player request submitted successfully!");
      setTimeout(() => {
        setSuccessMsg("");
        setShowForm(false);
      }, 2000);
    },
    onError: (msg) => setErrorMsg(msg),
  });

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
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-gold hover:bg-gold-light rounded-lg px-6 py-2 font-semibold text-black transition-colors"
          >
            Request Player
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {successMsg && (
            <div className="bg-gold-500/20 text-gold-300 rounded-lg p-3 text-sm">
              {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className="rounded-lg bg-red-500/20 p-3 text-sm text-red-400">
              {errorMsg}
            </div>
          )}

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
            idPrefix="adminReq"
          />

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
                setShowForm(false);
                setErrorMsg("");
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
}
