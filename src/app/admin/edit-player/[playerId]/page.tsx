"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "~/trpc/react";
import { isValidImageUrl } from "~/lib/utils";

export default function EditPlayerPage() {
  const params = useParams();
  const router = useRouter();
  const playerId = params.playerId as string;

  const { data: player, isLoading } = api.player.getById.useQuery(
    { id: playerId },
    { enabled: !!playerId },
  );

  const updatePlayer = api.player.update.useMutation({
    onSuccess: () => {
      setSuccessMessage("Player updated successfully!");
      setTimeout(() => {
        router.push("/admin/players");
      }, 1500);
    },
    onError: (error) => {
      setErrorMessage(error.message);
    },
  });

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [value, setValue] = useState(1);
  const [imgUrl, setImgUrl] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Populate form when player data loads
  useEffect(() => {
    if (player) {
      setFirstName(player.firstName);
      setLastName(player.lastName);
      setValue(player.value);
      setImgUrl(player.imgUrl);
    }
  }, [player]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    updatePlayer.mutate({
      id: playerId,
      firstName,
      lastName,
      value,
      imgUrl,
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="border-t-gold border-foreground/20 h-12 w-12 animate-spin rounded-full border-4" />
      </div>
    );
  }

  if (!player) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-foreground text-xl">Player not found</p>
          <Link
            href="/admin/players"
            className="text-gold mt-4 inline-block hover:underline"
          >
            Back to Players
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
          href="/admin/players"
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
          Back to Players
        </Link>
        <h1 className="text-foreground text-3xl font-bold">Edit Player</h1>
        <p className="text-foreground/50 mt-1">Update player information</p>
      </div>

      {/* Current Player Preview */}
      <div className="bg-foreground/5 mb-8 flex items-center gap-6 rounded-lg p-6">
        <div className="h-24 w-24 overflow-hidden rounded-lg bg-[#f2f2f2]">
          <img
            src={
              isValidImageUrl(imgUrl)
                ? imgUrl
                : isValidImageUrl(player.imgUrl)
                  ? player.imgUrl
                  : "/fallback-player.png"
            }
            alt={`${firstName} ${lastName}`}
            className="h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.src = "/fallback-player.png";
            }}
          />
        </div>
        <div>
          <p className="text-foreground text-xl font-semibold">
            {firstName} {lastName}
          </p>
          <p className="text-gold">${value} Player</p>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-gold-500/20 text-gold-300 mb-6 rounded-lg p-4">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="mb-6 rounded-lg bg-red-500/20 p-4 text-red-400">
          {errorMessage}
        </div>
      )}

      {/* Edit Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* First Name */}
        <div>
          <label
            htmlFor="firstName"
            className="text-foreground/80 mb-2 block text-sm font-medium"
          >
            First Name
          </label>
          <input
            type="text"
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className="focus:border-gold focus:ring-gold border-foreground/20 bg-foreground/10 text-foreground placeholder-foreground/50 w-full rounded-lg border px-4 py-3 focus:ring-1 focus:outline-none"
          />
        </div>

        {/* Last Name */}
        <div>
          <label
            htmlFor="lastName"
            className="text-foreground/80 mb-2 block text-sm font-medium"
          >
            Last Name
          </label>
          <input
            type="text"
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            className="focus:border-gold focus:ring-gold border-foreground/20 bg-foreground/10 text-foreground placeholder-foreground/50 w-full rounded-lg border px-4 py-3 focus:ring-1 focus:outline-none"
          />
        </div>

        {/* Value */}
        <div>
          <label
            htmlFor="value"
            className="text-foreground/80 mb-2 block text-sm font-medium"
          >
            Value ($1-$5)
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setValue(v)}
                className={`flex-1 rounded-lg py-3 text-sm font-medium transition-colors ${
                  value === v
                    ? "bg-gold text-black"
                    : "bg-foreground/10 text-foreground hover:bg-foreground/20"
                }`}
              >
                ${v}
              </button>
            ))}
          </div>
        </div>

        {/* Image URL */}
        <div>
          <label
            htmlFor="imgUrl"
            className="text-foreground/80 mb-2 block text-sm font-medium"
          >
            Image URL
          </label>
          <input
            type="url"
            id="imgUrl"
            value={imgUrl}
            onChange={(e) => setImgUrl(e.target.value)}
            required
            placeholder="https://example.com/player-image.jpg"
            className="focus:border-gold focus:ring-gold border-foreground/20 bg-foreground/10 text-foreground placeholder-foreground/50 w-full rounded-lg border px-4 py-3 focus:ring-1 focus:outline-none"
          />
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={updatePlayer.isPending}
            className="bg-gold hover:bg-gold-light flex-1 rounded-lg py-3 font-semibold text-black transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {updatePlayer.isPending ? "Saving..." : "Save Changes"}
          </button>
          <Link
            href="/admin/players"
            className="bg-foreground/10 text-foreground hover:bg-foreground/20 rounded-lg px-6 py-3 font-medium transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
