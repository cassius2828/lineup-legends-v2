"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "~/trpc/react";

// Value-based box-shadow glow colors
const valueShadows: Record<number, string> = {
  5: "shadow-[0px_0px_10px_3px_#99fcff]",
  4: "shadow-[0px_0px_10px_3px_#8317e8]",
  3: "shadow-[0px_0px_10px_3px_#e3b920]",
  2: "shadow-[0px_0px_10px_3px_#c0c0c0]",
  1: "shadow-[0px_0px_10px_3px_#804a14]",
};

export default function AdminPlayersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [valueFilter, setValueFilter] = useState<number | null>(null);

  // Request player form state
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestFirstName, setRequestFirstName] = useState("");
  const [requestLastName, setRequestLastName] = useState("");
  const [requestValue, setRequestValue] = useState(3);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [requestError, setRequestError] = useState("");

  const { data: players, isLoading } = api.player.search.useQuery(
    { query: searchQuery },
    { enabled: true },
  );

  const utils = api.useUtils();
  const createRequest = api.requestedPlayer.create.useMutation({
    onSuccess: () => {
      setRequestSuccess(true);
      setRequestFirstName("");
      setRequestLastName("");
      setRequestValue(3);
      void utils.requestedPlayer.getAll.invalidate();
      setTimeout(() => {
        setRequestSuccess(false);
        setShowRequestForm(false);
      }, 2000);
    },
    onError: (error) => {
      setRequestError(error.message);
    },
  });

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRequestError("");
    createRequest.mutate({
      firstName: requestFirstName,
      lastName: requestLastName,
      suggestedValue: requestValue,
    });
  };

  // Filter by value if selected
  const filteredPlayers = valueFilter
    ? players?.filter((p) => p.value === valueFilter)
    : players;

  return (
    <main className="min-h-screen bg-[#0a0a1a] p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-1 text-sm text-white/60 hover:text-white/80"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Home
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Find Players</h1>
              <p className="mt-2 text-white/60">
                Search and manage players in the database
              </p>
            </div>
            <Link
              href="/admin/add-player"
              className="bg-gold hover:bg-gold-light rounded-lg px-6 py-3 font-semibold text-black transition-colors"
            >
              + Add Player
            </Link>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="mb-8 flex flex-wrap gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by player name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="focus:border-gold focus:ring-gold w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/50 focus:ring-1 focus:outline-none"
            />
          </div>

          {/* Value Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setValueFilter(null)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                valueFilter === null
                  ? "bg-gold text-black"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              All
            </button>
            {[5, 4, 3, 2, 1].map((value) => (
              <button
                key={value}
                onClick={() => setValueFilter(value)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  valueFilter === value
                    ? "bg-gold text-black"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                ${value}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-sm text-white/60">
            {isLoading
              ? "Searching..."
              : `Found ${filteredPlayers?.length ?? 0} players`}
          </p>
        </div>

        {/* Player Grid */}
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="border-t-gold h-12 w-12 animate-spin rounded-full border-4 border-white/20" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {filteredPlayers?.map((player) => (
              <Link
                key={player._id.toString()}
                href={`/admin/edit-player/${player._id.toString()}`}
                className="group flex flex-col items-center"
              >
                {/* Player Image */}
                <div
                  className={`relative h-28 w-28 overflow-hidden bg-[#f2f2f2] transition-all duration-200 ${
                    valueShadows[player.value]
                  } cursor-pointer group-hover:scale-105`}
                >
                  <img
                    src={player.imgUrl}
                    alt={`${player.firstName} ${player.lastName}`}
                    className="absolute inset-0 h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/fallback-player.png";
                    }}
                  />
                </div>

                {/* Player Info */}
                <div className="mt-2 text-center">
                  <p className="text-sm font-medium text-white">
                    {player.firstName}
                  </p>
                  <p className="text-sm text-white/80">{player.lastName}</p>
                  <p className="text-gold mt-1 text-xs">${player.value}</p>
                </div>

                {/* Edit Indicator */}
                <p className="mt-2 text-xs text-white/40 opacity-0 transition-opacity group-hover:opacity-100">
                  Click to edit
                </p>
              </Link>
            ))}
          </div>
        )}

        {/* No Results */}
        {!isLoading && filteredPlayers?.length === 0 && (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <p className="text-lg text-white/60">No players found</p>
              <p className="mt-2 text-sm text-white/40">
                Try adjusting your search or filters
              </p>
            </div>
          </div>
        )}

        {/* Can't Find Player Section */}
        <div className="mt-12 rounded-lg border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Can&apos;t find the player you&apos;re looking for?
              </h2>
              <p className="mt-1 text-sm text-white/60">
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

          {/* Request Form */}
          {showRequestForm && (
            <form onSubmit={handleRequestSubmit} className="mt-6 space-y-4">
              {/* Success Message */}
              {requestSuccess && (
                <div className="rounded-lg bg-emerald-500/20 p-3 text-sm text-emerald-400">
                  Player request submitted successfully!
                </div>
              )}

              {/* Error Message */}
              {requestError && (
                <div className="rounded-lg bg-red-500/20 p-3 text-sm text-red-400">
                  {requestError}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                {/* First Name */}
                <div>
                  <label
                    htmlFor="requestFirstName"
                    className="mb-2 block text-sm font-medium text-white/80"
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
                    className="focus:border-gold focus:ring-gold w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white placeholder-white/50 focus:ring-1 focus:outline-none"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label
                    htmlFor="requestLastName"
                    className="mb-2 block text-sm font-medium text-white/80"
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
                    className="focus:border-gold focus:ring-gold w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white placeholder-white/50 focus:ring-1 focus:outline-none"
                  />
                </div>
              </div>

              {/* Suggested Value */}
              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">
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
                          : "bg-white/10 text-white hover:bg-white/20"
                      }`}
                    >
                      ${v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Actions */}
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
                  className="rounded-lg bg-white/10 px-6 py-2 font-medium text-white transition-colors hover:bg-white/20"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Link to view all requests (admin) */}
          <div className="mt-4 border-t border-white/10 pt-4">
            <Link
              href="/admin/requested"
              className="text-sm text-white/60 hover:text-white/80"
            >
              View all player requests →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
