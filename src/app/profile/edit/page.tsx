"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { api } from "~/trpc/react";

function ImageUploadField({
  label,
  currentUrl,
  onUrlChange,
  type,
  previewClass,
}: {
  label: string;
  currentUrl: string;
  onUrlChange: (url: string) => void;
  type: "profile" | "banner";
  previewClass: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = useCallback(
    async (file: File) => {
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", type);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error ?? "Upload failed");
        }

        const { url } = await res.json();
        onUrlChange(url);
      } catch (error) {
        console.error("Upload error:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to upload image",
        );
      } finally {
        setIsUploading(false);
      }
    },
    [type, onUrlChange],
  );

  return (
    <div>
      <label className="text-foreground/80 mb-2 block text-sm font-medium">
        {label}
      </label>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFileSelect(file);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className={`group border-foreground/20 hover:border-gold/50 relative w-full overflow-hidden rounded-xl border-2 border-dashed transition-colors ${previewClass}`}
      >
        {currentUrl ? (
          <>
            <Image
              fill
              src={currentUrl}
              alt={`${label} preview`}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/40">
              <span className="text-foreground rounded-lg bg-black/60 px-3 py-1.5 text-sm font-medium opacity-0 transition-opacity group-hover:opacity-100">
                {isUploading ? "Uploading..." : "Change Image"}
              </span>
            </div>
          </>
        ) : (
          <div className="text-foreground/40 flex h-full flex-col items-center justify-center gap-2">
            {isUploading ? (
              <>
                <div className="border-foreground/20 border-t-gold h-8 w-8 animate-spin rounded-full border-2" />
                <span className="text-sm">Uploading...</span>
              </>
            ) : (
              <>
                <svg
                  className="h-8 w-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-sm">Click to upload</span>
                <span className="text-xs">JPEG, PNG, WebP, GIF (max 5MB)</span>
              </>
            )}
          </div>
        )}
      </button>
    </div>
  );
}

export default function EditProfilePage() {
  const router = useRouter();
  const { data: profile, isLoading } = api.profile.getMe.useQuery();

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [profileImg, setProfileImg] = useState("");
  const [bannerImg, setBannerImg] = useState("");

  useEffect(() => {
    if (profile) {
      setUsername(profile.username ?? "");
      setBio(profile.bio ?? "");
      setProfileImg(profile.profileImg ?? "");
      setBannerImg(profile.bannerImg ?? "");
    }
  }, [profile]);

  const updateProfile = api.profile.update.useMutation({
    onSuccess: () => {
      router.push(`/profile/${profile?.id}`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate({
      username: username || undefined,
      bio: bio || undefined,
      profileImg: profileImg || null,
      bannerImg: bannerImg || null,
    });
  };

  if (isLoading) {
    return (
      <main className="from-surface-950 via-surface-800 to-surface-950 min-h-screen bg-gradient-to-b">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="border-foreground/20 border-t-gold mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4" />
            <p className="text-foreground/60">Loading...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="from-surface-950 via-surface-800 to-surface-950 min-h-screen bg-gradient-to-b">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-foreground text-2xl font-bold">Please sign in</h1>
          <Link
            href="/sign-in"
            className="text-gold-300 mt-4 inline-block hover:underline"
          >
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="from-surface-950 via-surface-800 to-surface-950 min-h-screen bg-gradient-to-b">
      <div className="container mx-auto max-w-2xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/profile/${profile.id}`}
            className="text-foreground/60 hover:text-foreground/80 mb-2 inline-flex items-center gap-1 text-sm"
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
            Back to Profile
          </Link>
          <h1 className="text-foreground text-3xl font-bold">Edit Profile</h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Live Preview */}
          <div className="bg-surface-800 overflow-hidden rounded-2xl">
            <div
              className="h-32 bg-cover bg-center"
              style={{
                backgroundImage: bannerImg
                  ? `url(${bannerImg})`
                  : "linear-gradient(135deg, #059669, #0891b2, #6366f1)",
              }}
            />
            <div className="relative -mt-12 px-6 pb-6">
              <div className="border-surface-600 bg-surface-600 h-24 w-24 overflow-hidden rounded-full border-4">
                <Image
                  width={96}
                  height={96}
                  src={profileImg || profile.image || "/default-avatar.png"}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="text-foreground mt-2 font-semibold">
                {username || profile.name || "Your Name"}
              </p>
              {bio && <p className="text-foreground/60 text-sm">{bio}</p>}
            </div>
          </div>

          {/* Banner Image Upload */}
          <ImageUploadField
            label="Banner Image"
            currentUrl={bannerImg}
            onUrlChange={setBannerImg}
            type="banner"
            previewClass="h-32"
          />

          {/* Profile Image Upload */}
          <ImageUploadField
            label="Profile Image"
            currentUrl={profileImg}
            onUrlChange={setProfileImg}
            type="profile"
            previewClass="mx-auto h-32 w-32 rounded-full"
          />

          {/* Username */}
          <div>
            <label className="text-foreground/80 mb-2 block text-sm font-medium">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter a unique username"
              className="border-foreground/10 bg-foreground/5 text-foreground placeholder-foreground/40 focus:border-gold focus:ring-gold w-full rounded-lg border px-4 py-3 focus:ring-1 focus:outline-none"
              minLength={3}
              maxLength={30}
            />
            <p className="text-foreground/50 mt-1 text-xs">3-30 characters</p>
          </div>

          {/* Bio */}
          <div>
            <label className="text-foreground/80 mb-2 block text-sm font-medium">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              rows={3}
              className="border-foreground/10 bg-foreground/5 text-foreground placeholder-foreground/40 focus:border-gold focus:ring-gold w-full resize-none rounded-lg border px-4 py-3 focus:ring-1 focus:outline-none"
              maxLength={250}
            />
            <p className="text-foreground/50 mt-1 text-xs">{bio.length}/250</p>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <Link
              href={`/profile/${profile.id}`}
              className="bg-foreground/10 text-foreground hover:bg-foreground/20 flex-1 rounded-lg py-3 text-center font-medium transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={updateProfile.isPending}
              className="bg-gold hover:bg-gold-light flex-1 rounded-lg py-3 font-semibold text-black transition-colors disabled:opacity-50"
            >
              {updateProfile.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
