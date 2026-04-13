"use client";

import { useState, useEffect } from "react";
import { Button } from "~/app/_components/common/ui/Button";
import { ValuePicker } from "~/app/_components/common/ui/ValuePicker";
import { isValidImageUrl } from "~/lib/utils";
import Link from "next/link";

export type PlayerFormData = {
  firstName: string;
  lastName: string;
  value: number;
  imgUrl: string;
};

type PlayerFormProps = {
  mode: "add" | "edit";
  initialValues?: PlayerFormData;
  onSubmit: (data: PlayerFormData) => void;
  isPending: boolean;
  successMessage: string;
  errorMessage: string;
  backHref: string;
};

export function PlayerForm({
  mode,
  initialValues,
  onSubmit,
  isPending,
  successMessage,
  errorMessage,
  backHref,
}: PlayerFormProps) {
  const [firstName, setFirstName] = useState(initialValues?.firstName ?? "");
  const [lastName, setLastName] = useState(initialValues?.lastName ?? "");
  const [value, setValue] = useState(initialValues?.value ?? 3);
  const [imgUrl, setImgUrl] = useState(initialValues?.imgUrl ?? "");

  useEffect(() => {
    if (initialValues) {
      setFirstName(initialValues.firstName);
      setLastName(initialValues.lastName);
      setValue(initialValues.value);
      setImgUrl(initialValues.imgUrl);
    }
  }, [initialValues]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ firstName, lastName, value, imgUrl });
  };

  const showPreview = mode === "edit" || firstName || lastName || imgUrl;

  const previewImgSrc = (() => {
    if (isValidImageUrl(imgUrl)) return imgUrl;
    if (
      mode === "edit" &&
      initialValues &&
      isValidImageUrl(initialValues.imgUrl)
    )
      return initialValues.imgUrl;
    return null;
  })();

  return (
    <>
      {showPreview && (
        <div className="bg-foreground/5 mb-8 flex items-center gap-6 rounded-lg p-6">
          <div className="h-24 w-24 overflow-hidden rounded-lg bg-[#f2f2f2]">
            {previewImgSrc ? (
              <img
                src={previewImgSrc}
                alt={`${firstName} ${lastName}`}
                className="h-full w-full object-cover"
                onError={(e) => {
                  if (mode === "edit") {
                    e.currentTarget.src = "/fallback-player.png";
                  } else {
                    e.currentTarget.style.display = "none";
                  }
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

      <form onSubmit={handleSubmit} className="space-y-6">
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
            placeholder={mode === "add" ? "e.g. Stephen" : undefined}
            className="focus:border-gold focus:ring-gold border-foreground/20 bg-foreground/10 text-foreground placeholder-foreground/50 w-full rounded-lg border px-4 py-3 focus:ring-1 focus:outline-none"
          />
        </div>

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
            placeholder={mode === "add" ? "e.g. Curry" : undefined}
            className="focus:border-gold focus:ring-gold border-foreground/20 bg-foreground/10 text-foreground placeholder-foreground/50 w-full rounded-lg border px-4 py-3 focus:ring-1 focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="value"
            className="text-foreground/80 mb-2 block text-sm font-medium"
          >
            Value ($1-$5)
          </label>
          <ValuePicker value={value} onChange={setValue} />
        </div>

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

        <div className="flex gap-4">
          <Button
            type="submit"
            color="gold"
            variant="solid"
            loading={isPending}
            loadingText={mode === "add" ? "Adding..." : "Saving..."}
            className="flex-1 py-3 font-semibold"
          >
            {mode === "add" ? "Add Player" : "Save Changes"}
          </Button>
          <Link
            href={backHref}
            className="bg-foreground/10 text-foreground hover:bg-foreground/20 rounded-lg px-6 py-3 font-medium transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </>
  );
}
