"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "~/trpc/react";

export default function RequestedPlayerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.id as string;

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: requestedPlayer, isLoading } =
    api.requestedPlayer.getById.useQuery(
      { id: requestId },
      { enabled: !!requestId },
    );

  const utils = api.useUtils();
  const deleteRequest = api.requestedPlayer.delete.useMutation({
    onSuccess: () => {
      void utils.requestedPlayer.getAll.invalidate();
      router.push("/admin/requested");
    },
  });

  const handleDelete = () => {
    deleteRequest.mutate({ id: requestId });
  };

  // Format date helper
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0a0a1a]">
        <div className="border-t-gold h-12 w-12 animate-spin rounded-full border-4 border-white/20" />
      </main>
    );
  }

  if (!requestedPlayer) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0a0a1a]">
        <div className="text-center">
          <p className="text-xl text-white">Requested player not found</p>
          <Link
            href="/admin/requested"
            className="text-gold mt-4 inline-block hover:underline"
          >
            Back to Requested Players
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a1a] p-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/requested"
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
            Back to Requested Players
          </Link>
          <h1 className="text-3xl font-bold text-white">Player Request</h1>
          <p className="mt-2 text-white/60">
            View request details and user suggestions
          </p>
        </div>

        {/* Player Info Card */}
        <div className="mb-8 rounded-lg bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Initials Avatar */}
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-white/10">
                <span className="text-2xl font-bold text-white/60">
                  {requestedPlayer.firstName.charAt(0)}
                  {requestedPlayer.lastName.charAt(0)}
                </span>
              </div>
              <div>
                <p className="text-2xl font-semibold text-white">
                  {requestedPlayer.firstName} {requestedPlayer.lastName}
                </p>
                <p className="text-sm text-white/60">
                  {requestedPlayer.descriptions.length}{" "}
                  {requestedPlayer.descriptions.length === 1
                    ? "value suggestion"
                    : "value suggestions"}
                </p>
              </div>
            </div>

            {/* Delete Button */}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded-lg bg-red-600/20 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-600/30"
            >
              Delete Request
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="mx-4 w-full max-w-md rounded-lg bg-[#1a1a2e] p-6">
              <h3 className="text-xl font-semibold text-white">
                Delete Request?
              </h3>
              <p className="mt-2 text-white/60">
                This will permanently delete the request for{" "}
                <span className="font-medium text-white">
                  {requestedPlayer.firstName} {requestedPlayer.lastName}
                </span>{" "}
                and all associated value suggestions.
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleDelete}
                  disabled={deleteRequest.isPending}
                  className="flex-1 rounded-lg bg-red-600 py-2 font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-50"
                >
                  {deleteRequest.isPending ? "Deleting..." : "Delete"}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 rounded-lg bg-white/10 py-2 font-medium text-white transition-colors hover:bg-white/20"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Value Suggestions List */}
        <div>
          <h2 className="mb-4 text-xl font-semibold text-white">
            Value Suggestions
          </h2>
          <div className="space-y-3">
            {requestedPlayer.descriptions.map((desc) => (
              <div
                key={desc.id}
                className="rounded-lg border border-white/10 bg-white/5 p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* User Avatar */}
                    {desc.user?.image ? (
                      <img
                        src={desc.user.image}
                        alt={desc.user.name ?? "User"}
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                        <span className="text-sm font-medium text-white/60">
                          {desc.user?.name?.charAt(0) ?? "?"}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-white">
                        {desc.user?.name ?? "Unknown User"}
                      </p>
                      <p className="text-xs text-white/50">
                        {formatDate(desc.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Suggested Value Badge */}
                  <div className="bg-gold rounded-lg px-4 py-2 text-lg font-bold text-black">
                    ${desc.suggestedValue}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-white/60">
            To add this player to the database, go to{" "}
            <Link
              href="/admin/add-player"
              className="text-gold hover:underline"
            >
              Add Player
            </Link>{" "}
            and create a new player with the name &quot;
            {requestedPlayer.firstName} {requestedPlayer.lastName}&quot;.
          </p>
        </div>
      </div>
    </main>
  );
}
