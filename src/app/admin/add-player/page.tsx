"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "~/trpc/react";
import { Button } from "~/app/_components/ui/Button";
import { isValidImageUrl } from "~/lib/utils";

export default function AddPlayerPage() {
  const router = useRouter();

  const createPlayer = api.player.create.useMutation({
    onSuccess: (player) => {
      setSuccessMessage(
        `Player "${player.firstName} ${player.lastName}" created successfully!`,
      );
      // Reset form
      setFirstName("");
      setLastName("");
      setValue(3);
      setImgUrl("");
      // Redirect after a short delay
      setTimeout(() => {
        router.push("/admin/players");
      }, 2000);
    },
    onError: (error) => {
      setErrorMessage(error.message);
    },
  });

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [value, setValue] = useState(3);
  const [imgUrl, setImgUrl] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    createPlayer.mutate({
      firstName,
      lastName,
      value,
      imgUrl,
    });
  };

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
        <h1 className="text-foreground text-3xl font-bold">Add New Player</h1>
        <p className="text-foreground/50 mt-1">
          Add a new player to the database
        </p>
      </div>

      {/* Player Preview */}
      {(firstName || lastName || imgUrl) && (
        <div className="bg-foreground/5 mb-8 flex items-center gap-6 rounded-lg p-6">
          <div className="h-24 w-24 overflow-hidden rounded-lg bg-[#f2f2f2]">
            {isValidImageUrl(imgUrl) ? (
              <img
                src={imgUrl}
                alt={`${firstName} ${lastName}`}
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-4xl text-gray-400">
                ?
              </div>
            )}
          </div>
          <div>
            <p className="text-foreground text-xl font-semibold">
              {firstName || "First"} {lastName || "Last"}
            </p>
            <p className="text-gold">${value} Player</p>
          </div>
        </div>
      )}

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

      {/* Add Player Form */}
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
            placeholder="e.g. Stephen"
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
            placeholder="e.g. Curry"
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
          <Button
            type="submit"
            color="gold"
            variant="solid"
            loading={createPlayer.isPending}
            loadingText="Adding..."
            className="flex-1 py-3 font-semibold"
          >
            Add Player
          </Button>
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
