"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { api } from "~/trpc/react";
import { Button } from "~/app/_components/ui/Button";
import { isValidImageUrl } from "~/lib/utils";
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
        <div className="border-t-gold border-foreground/20 h-12 w-12 animate-spin rounded-full border-4" />
      </div>
    );
  }

  if (!requestedPlayer) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-foreground text-xl">Requested player not found</p>
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
          className="text-foreground/60 hover:text-foreground/80 mb-4 inline-flex items-center gap-1 text-sm"
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
        <h1 className="text-foreground text-3xl font-bold">Player Request</h1>
        <p className="text-foreground/60 mt-2">
          View request details and user suggestions
        </p>
      </div>

      {/* Player Info Card */}
      <div className="border-foreground/10 bg-foreground/3 mb-8 rounded-xl border p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {isValidImageUrl(playerImgUrl.trim()) && !imgPreviewError ? (
              <img
                src={playerImgUrl.trim()}
                alt={`${requestedPlayer.firstName} ${requestedPlayer.lastName}`}
                className="h-16 w-16 rounded-lg object-cover"
                onError={() => setImgPreviewError(true)}
              />
            ) : (
              <div className="bg-foreground/10 flex h-16 w-16 items-center justify-center rounded-lg">
                <span className="text-foreground/60 text-2xl font-bold">
                  {requestedPlayer.firstName.charAt(0)}
                  {requestedPlayer.lastName.charAt(0)}
                </span>
              </div>
            )}
            <div>
              <p className="text-foreground text-2xl font-semibold">
                {requestedPlayer.firstName} {requestedPlayer.lastName}
              </p>
              <p className="text-foreground/60 text-sm">
                {requestedPlayer.descriptions.length}{" "}
                {requestedPlayer.descriptions.length === 1
                  ? "value suggestion"
                  : "value suggestions"}
              </p>
            </div>
          </div>

          <Button
            onClick={() => setShowDeleteConfirm(true)}
            color="red"
            variant="subtle"
            className="px-4 py-2"
          >
            Delete Request
          </Button>
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
        <h2 className="text-foreground mb-4 text-xl font-semibold">
          Value Suggestions
        </h2>
        <div className="space-y-3">
          {requestedPlayer.descriptions.map((desc) => (
            <div
              key={String(desc.id)}
              className="border-foreground/10 bg-foreground/3 rounded-lg border p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Image
                    width={40}
                    height={40}
                    src={desc.user?.image ?? "/default-user.jpg"}
                    alt={desc.user?.name ?? "User"}
                    className="h-10 w-10 rounded-full"
                  />
                  <div>
                    <p className="text-foreground font-medium">
                      {desc.user?.name ?? "Unknown User"}
                    </p>
                    <p className="text-foreground/50 text-xs">
                      {formatDate(desc.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="bg-gold rounded-lg px-4 py-2 text-lg font-bold text-black">
                  ${desc.suggestedValue}
                </div>
              </div>
              {desc.note && (
                <p className="bg-foreground/5 text-foreground/60 mt-2 rounded-md px-3 py-2 text-sm italic">
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
          <h2 className="text-foreground mb-4 text-xl font-semibold">
            Potential Duplicates
          </h2>
          <DuplicateHints duplicates={duplicates} />
        </div>
      )}

      {/* Quick Add Player */}
      <div className="border-foreground/10 bg-foreground/3 mt-8 rounded-xl border p-6">
        <h2 className="text-foreground mb-4 text-xl font-semibold">
          Quick Add Player
        </h2>

        {playerCreated ? (
          <div>
            <div className="bg-gold-300/10 mb-4 flex items-center gap-3 rounded-lg p-4">
              <Check className="text-gold-300 h-5 w-5" />
              <p className="text-gold-300 text-sm font-medium">
                {requestedPlayer.firstName} {requestedPlayer.lastName} has been
                added to the database!
              </p>
            </div>
            <Button
              onClick={handleAddAndRemoveRequest}
              color="red"
              variant="subtle"
              loading={deleteRequest.isPending}
              loadingText="Removing..."
              className="w-full py-2.5"
            >
              Remove this request
            </Button>
          </div>
        ) : (
          <form onSubmit={handleQuickAdd} className="space-y-4">
            <div className="bg-foreground/3 rounded-lg p-3">
              <p className="text-foreground/40 text-sm">Player name</p>
              <p className="text-foreground font-medium">
                {requestedPlayer.firstName} {requestedPlayer.lastName}
              </p>
            </div>

            <div>
              <label className="text-foreground/60 mb-1.5 block text-sm">
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
              <p className="text-foreground/30 mt-1.5 text-xs">
                Average suggested: ${avgSuggestedValue}
              </p>
            </div>

            <div>
              <label className="text-foreground/60 mb-1.5 block text-sm">
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
                className="border-foreground/10 bg-foreground/5 text-foreground placeholder-foreground/30 focus:border-foreground/30 w-full rounded-lg border px-3 py-2.5 text-sm transition-colors outline-none"
              />
            </div>

            <Button
              type="submit"
              disabled={!playerImgUrl.trim()}
              color="gold"
              variant="solid"
              loading={createPlayer.isPending}
              loadingText="Adding Player..."
              className="w-full py-2.5 font-semibold"
            >
              Add Player to Database
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
