"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { ConfirmModal } from "~/app/_components/common/ConfirmModal";
import { DuplicateHints } from "~/app/_components/PlayerRequest/DuplicateHints";

export default function RequestedPlayerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.id as string;

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [playerValue, setPlayerValue] = useState(3);
  const [playerImgUrl, setPlayerImgUrl] = useState("");
  const [imgPreviewError, setImgPreviewError] = useState(false);
  const [playerCreated, setPlayerCreated] = useState(false);

  const { data: requestedPlayer, isLoading } =
    api.requestedPlayer.getById.useQuery(
      { id: requestId },
      { enabled: !!requestId },
    );

  const { data: duplicates } = api.requestedPlayer.searchDuplicates.useQuery(
    {
      firstName: requestedPlayer?.firstName ?? "",
      lastName: requestedPlayer?.lastName ?? "",
    },
    { enabled: !!requestedPlayer },
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
        <div className="border-t-gold h-12 w-12 animate-spin rounded-full border-4 border-foreground/20" />
      </div>
    );
  }

  if (!requestedPlayer) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-foreground">Requested player not found</p>
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
          className="mb-4 inline-flex items-center gap-1 text-sm text-foreground/60 hover:text-foreground/80"
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
        <h1 className="text-3xl font-bold text-foreground">Player Request</h1>
        <p className="mt-2 text-foreground/60">
          View request details and user suggestions
        </p>
      </div>

      {/* Player Info Card */}
      <div className="mb-8 rounded-xl border border-foreground/10 bg-foreground/3 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {playerImgUrl.trim() && !imgPreviewError ? (
              <img
                src={playerImgUrl.trim()}
                alt={`${requestedPlayer.firstName} ${requestedPlayer.lastName}`}
                className="h-16 w-16 rounded-lg object-cover"
                onError={() => setImgPreviewError(true)}
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-foreground/10">
                <span className="text-2xl font-bold text-foreground/60">
                  {requestedPlayer.firstName.charAt(0)}
                  {requestedPlayer.lastName.charAt(0)}
                </span>
              </div>
            )}
            <div>
              <p className="text-2xl font-semibold text-foreground">
                {requestedPlayer.firstName} {requestedPlayer.lastName}
              </p>
              <p className="text-sm text-foreground/60">
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

      <ConfirmModal
        open={showDeleteConfirm}
        title="Delete Request?"
        description={`This will permanently delete the request for ${requestedPlayer.firstName} ${requestedPlayer.lastName} and all associated value suggestions.`}
        confirmLabel={deleteRequest.isPending ? "Deleting..." : "Delete"}
        variant="danger"
        loading={deleteRequest.isPending}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* Value Suggestions List */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          Value Suggestions
        </h2>
        <div className="space-y-3">
          {requestedPlayer.descriptions.map((desc) => (
            <div
              key={String(desc.id)}
              className="rounded-lg border border-foreground/10 bg-foreground/3 p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {desc.user?.image ? (
                    <Image
                      width={40}
                      height={40}
                      src={desc.user.image}
                      alt={desc.user.name ?? "User"}
                      className="h-10 w-10 rounded-full"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground/10">
                      <span className="text-sm font-medium text-foreground/60">
                        {desc.user?.name?.charAt(0) ?? "?"}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-foreground">
                      {desc.user?.name ?? "Unknown User"}
                    </p>
                    <p className="text-xs text-foreground/50">
                      {formatDate(desc.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="bg-gold rounded-lg px-4 py-2 text-lg font-bold text-black">
                  ${desc.suggestedValue}
                </div>
              </div>
              {desc.note && (
                <p className="mt-2 rounded-md bg-foreground/5 px-3 py-2 text-sm text-foreground/60 italic">
                  &ldquo;{desc.note}&rdquo;
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Potential Duplicates */}
      {duplicates && duplicates.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            Potential Duplicates
          </h2>
          <DuplicateHints duplicates={duplicates} />
        </div>
      )}

      {/* Quick Add Player */}
      <div className="mt-8 rounded-xl border border-foreground/10 bg-foreground/3 p-6">
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          Quick Add Player
        </h2>

        {playerCreated ? (
          <div>
            <div className="mb-4 flex items-center gap-3 rounded-lg bg-gold-300/10 p-4">
              <Check className="h-5 w-5 text-gold-300" />
              <p className="text-sm font-medium text-gold-300">
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
            <div className="rounded-lg bg-foreground/3 p-3">
              <p className="text-sm text-foreground/40">Player name</p>
              <p className="font-medium text-foreground">
                {requestedPlayer.firstName} {requestedPlayer.lastName}
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm text-foreground/60">
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
                        : "bg-foreground/10 text-foreground/60 hover:bg-foreground/20"
                    }`}
                  >
                    ${v}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-foreground/30">
                Average suggested: ${avgSuggestedValue}
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm text-foreground/60">
                Image URL
              </label>
              <input
                type="url"
                value={playerImgUrl}
                onChange={(e) => {
                  setPlayerImgUrl(e.target.value);
                  setImgPreviewError(false);
                }}
                placeholder="https://example.com/player-image.jpg"
                required
                className="w-full rounded-lg border border-foreground/10 bg-foreground/5 px-3 py-2.5 text-sm text-foreground placeholder-foreground/30 outline-none transition-colors focus:border-foreground/30"
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
