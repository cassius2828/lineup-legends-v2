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
            <h1 className="text-foreground text-3xl font-bold">
              Requested Players
            </h1>
            <p className="text-foreground/50 mt-1">
              View and manage player requests submitted by users
            </p>
          </div>
          <Link
            href="/admin/players"
            className="bg-foreground/10 text-foreground hover:bg-foreground/20 rounded-lg px-6 py-3 font-semibold transition-colors"
          >
            View All Players
          </Link>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-foreground/50 text-sm">
          {isLoading
            ? "Loading..."
            : `${requestedPlayers?.length ?? 0} player requests`}
        </p>
      </div>

      {/* Requested Players Grid */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="border-t-gold border-foreground/20 h-12 w-12 animate-spin rounded-full border-4" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {requestedPlayers?.map((player) => (
            <Link
              key={player.id}
              href={`/admin/requested/${player.id}`}
              className="group flex flex-col items-center"
            >
              <div className="bg-foreground/10 group-hover:bg-foreground/20 relative flex h-28 w-28 cursor-pointer items-center justify-center overflow-hidden rounded-lg transition-all duration-200 group-hover:scale-105">
                <span className="text-foreground/60 text-2xl font-bold">
                  {player.firstName.charAt(0)}
                  {player.lastName.charAt(0)}
                </span>

                <div className="bg-gold absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-black">
                  {player.descriptionCount}
                </div>
              </div>

              <div className="mt-2 text-center">
                <p className="text-foreground text-sm font-medium">
                  {player.firstName}
                </p>
                <p className="text-foreground/80 text-sm">{player.lastName}</p>
                <p className="text-foreground/60 mt-1 text-xs">
                  {player.descriptionCount}{" "}
                  {player.descriptionCount === 1 ? "request" : "requests"}
                </p>
              </div>

              <p className="text-foreground/40 mt-2 text-xs opacity-0 transition-opacity group-hover:opacity-100">
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
            <p className="text-foreground/60 text-lg">No player requests yet</p>
            <p className="text-foreground/40 mt-2 text-sm">
              Users can request players from the Find Players page
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
