"use client";

import Link from "next/link";
import { api } from "~/trpc/react";

export default function AdminRequestedPlayersPage() {
  const { data: requestedPlayers, isLoading } =
    api.requestedPlayer.getAll.useQuery();

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Requested Players
            </h1>
            <p className="mt-1 text-white/50">
              View and manage player requests submitted by users
            </p>
          </div>
          <Link
            href="/admin/players"
            className="rounded-lg bg-white/10 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/20"
          >
            View All Players
          </Link>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-sm text-white/50">
          {isLoading
            ? "Loading..."
            : `${requestedPlayers?.length ?? 0} player requests`}
        </p>
      </div>

      {/* Requested Players Grid */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="border-t-gold h-12 w-12 animate-spin rounded-full border-4 border-white/20" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {requestedPlayers?.map((player) => (
            <Link
              key={player.id}
              href={`/admin/requested/${player.id}`}
              className="group flex flex-col items-center"
            >
              <div className="relative flex h-28 w-28 cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-white/10 transition-all duration-200 group-hover:scale-105 group-hover:bg-white/20">
                <span className="text-2xl font-bold text-white/60">
                  {player.firstName.charAt(0)}
                  {player.lastName.charAt(0)}
                </span>

                <div className="bg-gold absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-black">
                  {player.descriptionCount}
                </div>
              </div>

              <div className="mt-2 text-center">
                <p className="text-sm font-medium text-white">
                  {player.firstName}
                </p>
                <p className="text-sm text-white/80">{player.lastName}</p>
                <p className="mt-1 text-xs text-white/60">
                  {player.descriptionCount}{" "}
                  {player.descriptionCount === 1 ? "request" : "requests"}
                </p>
              </div>

              <p className="mt-2 text-xs text-white/40 opacity-0 transition-opacity group-hover:opacity-100">
                Click to view
              </p>
            </Link>
          ))}
        </div>
      )}

      {/* No Results */}
      {!isLoading && requestedPlayers?.length === 0 && (
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-white/60">No player requests yet</p>
            <p className="mt-2 text-sm text-white/40">
              Users can request players from the Find Players page
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
