"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { Check } from "lucide-react";

export default function RequestedPlayerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.id as string;

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [playerValue, setPlayerValue] = useState(3);
  const [playerImgUrl, setPlayerImgUrl] = useState("");
  const [playerCreated, setPlayerCreated] = useState(false);

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

  const createPlayer = api.player.create.useMutation({
    onSuccess: () => {
      setPlayerCreated(true);
      toast.success(
        `Player "${requestedPlayer?.firstName} ${requestedPlayer?.lastName}" added to the database!`,
      );
      void utils.player.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleDelete = () => {
    deleteRequest.mutate({ id: requestId });
  };

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestedPlayer || !playerImgUrl.trim()) return;
    createPlayer.mutate({
      firstName: requestedPlayer.firstName,
      lastName: requestedPlayer.lastName,
      value: playerValue,
      imgUrl: playerImgUrl.trim(),
    });
  };

  const handleAddAndRemoveRequest = () => {
    deleteRequest.mutate({ id: requestId });
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Compute the average suggested value for pre-filling
  const avgSuggestedValue =
    requestedPlayer && requestedPlayer.descriptions.length > 0
      ? Math.round(
          requestedPlayer.descriptions.reduce(
            (sum, d) => sum + d.suggestedValue,
            0,
          ) / requestedPlayer.descriptions.length,
        )
      : 3;

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="border-t-gold h-12 w-12 animate-spin rounded-full border-4 border-white/20" />
      </div>
    );
  }

  if (!requestedPlayer) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-white">Requested player not found</p>
          <Link
            href="/admin/requested"
            className="text-gold mt-4 inline-block hover:underline"
          >
            Back to Requested Players
          </Link>
        </div>
      </div>
    );
  }

  return (
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
      <div className="mb-8 rounded-xl border border-white/10 bg-white/3 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
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
              className="rounded-lg border border-white/10 bg-white/3 p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
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

                <div className="bg-gold rounded-lg px-4 py-2 text-lg font-bold text-black">
                  ${desc.suggestedValue}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Add Player */}
      <div className="mt-8 rounded-xl border border-white/10 bg-white/3 p-6">
        <h2 className="mb-4 text-xl font-semibold text-white">
          Quick Add Player
        </h2>

        {playerCreated ? (
          <div>
            <div className="mb-4 flex items-center gap-3 rounded-lg bg-emerald-400/10 p-4">
              <Check className="h-5 w-5 text-emerald-400" />
              <p className="text-sm font-medium text-emerald-400">
                {requestedPlayer.firstName} {requestedPlayer.lastName} has been
                added to the database!
              </p>
            </div>
            <button
              onClick={handleAddAndRemoveRequest}
              disabled={deleteRequest.isPending}
              className="w-full rounded-lg bg-red-600/20 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-600/30 disabled:opacity-50"
            >
              {deleteRequest.isPending
                ? "Removing..."
                : "Remove this request"}
            </button>
          </div>
        ) : (
          <form onSubmit={handleQuickAdd} className="space-y-4">
            <div className="rounded-lg bg-white/3 p-3">
              <p className="text-sm text-white/40">Player name</p>
              <p className="font-medium text-white">
                {requestedPlayer.firstName} {requestedPlayer.lastName}
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm text-white/60">
                Value (1-5)
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setPlayerValue(v)}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold transition-all ${
                      playerValue === v
                        ? "bg-gold text-black"
                        : "bg-white/10 text-white/60 hover:bg-white/20"
                    }`}
                  >
                    ${v}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-white/30">
                Average suggested: ${avgSuggestedValue}
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm text-white/60">
                Image URL
              </label>
              <input
                type="url"
                value={playerImgUrl}
                onChange={(e) => setPlayerImgUrl(e.target.value)}
                placeholder="https://example.com/player-image.jpg"
                required
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-white/30"
              />
            </div>

            <button
              type="submit"
              disabled={createPlayer.isPending || !playerImgUrl.trim()}
              className="bg-gold hover:bg-gold-light w-full rounded-lg py-2.5 text-sm font-semibold text-black transition-colors disabled:opacity-50"
            >
              {createPlayer.isPending ? "Adding Player..." : "Add Player to Database"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
