"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "~/trpc/react";

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
        <div className="border-t-gold h-12 w-12 animate-spin rounded-full border-4 border-white/20" />
      </div>
    );
  }

  if (!player) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-white">Player not found</p>
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
          Back to Players
        </Link>
        <h1 className="text-3xl font-bold text-white">Edit Player</h1>
        <p className="mt-1 text-white/50">Update player information</p>
      </div>

        {/* Current Player Preview */}
        <div className="mb-8 flex items-center gap-6 rounded-lg bg-white/5 p-6">
          <div className="h-24 w-24 overflow-hidden rounded-lg bg-[#f2f2f2]">
            <img
              src={imgUrl || player.imgUrl}
              alt={`${firstName} ${lastName}`}
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "/fallback-player.png";
              }}
            />
          </div>
          <div>
            <p className="text-xl font-semibold text-white">
              {firstName} {lastName}
            </p>
            <p className="text-gold">${value} Player</p>
          </div>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 rounded-lg bg-emerald-500/20 p-4 text-emerald-400">
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
              className="mb-2 block text-sm font-medium text-white/80"
            >
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="focus:border-gold focus:ring-gold w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/50 focus:ring-1 focus:outline-none"
            />
          </div>

          {/* Last Name */}
          <div>
            <label
              htmlFor="lastName"
              className="mb-2 block text-sm font-medium text-white/80"
            >
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="focus:border-gold focus:ring-gold w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/50 focus:ring-1 focus:outline-none"
            />
          </div>

          {/* Value */}
          <div>
            <label
              htmlFor="value"
              className="mb-2 block text-sm font-medium text-white/80"
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
                      : "bg-white/10 text-white hover:bg-white/20"
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
              className="mb-2 block text-sm font-medium text-white/80"
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
              className="focus:border-gold focus:ring-gold w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/50 focus:ring-1 focus:outline-none"
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
              className="rounded-lg bg-white/10 px-6 py-3 font-medium text-white transition-colors hover:bg-white/20"
            >
              Cancel
            </Link>
          </div>
        </form>
    </div>
  );
}
