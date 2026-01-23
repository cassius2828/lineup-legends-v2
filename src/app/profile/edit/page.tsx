"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "~/trpc/react";

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
      alert(error.message);
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
      <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-emerald-500" />
            <p className="text-white/60">Loading...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-white">Please sign in</h1>
          <Link
            href="/api/auth/signin"
            className="mt-4 inline-block text-emerald-400 hover:underline"
          >
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto max-w-2xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/profile/${profile.id}`}
            className="mb-2 inline-flex items-center gap-1 text-sm text-white/60 hover:text-white/80"
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
          <h1 className="text-3xl font-bold text-white">Edit Profile</h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Preview */}
          <div className="overflow-hidden rounded-2xl bg-slate-800">
            <div
              className="h-32 bg-cover bg-center"
              style={{
                backgroundImage: bannerImg
                  ? `url(${bannerImg})`
                  : "linear-gradient(to right, #059669, #0891b2)",
              }}
            />
            <div className="relative -mt-12 px-6 pb-6">
              <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-slate-800 bg-slate-700">
                <img
                  src={profileImg || profile.image || "/default-avatar.png"}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="mt-2 font-semibold text-white">
                {username || profile.name || "Your Name"}
              </p>
              {bio && <p className="text-sm text-white/60">{bio}</p>}
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="mb-2 block text-sm font-medium text-white/80">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter a unique username"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              minLength={3}
              maxLength={30}
            />
            <p className="mt-1 text-xs text-white/50">3-30 characters</p>
          </div>

          {/* Bio */}
          <div>
            <label className="mb-2 block text-sm font-medium text-white/80">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              rows={3}
              className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              maxLength={250}
            />
            <p className="mt-1 text-xs text-white/50">{bio.length}/250</p>
          </div>

          {/* Profile Image URL */}
          <div>
            <label className="mb-2 block text-sm font-medium text-white/80">
              Profile Image URL
            </label>
            <input
              type="url"
              value={profileImg}
              onChange={(e) => setProfileImg(e.target.value)}
              placeholder="https://example.com/your-image.jpg"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Banner Image URL */}
          <div>
            <label className="mb-2 block text-sm font-medium text-white/80">
              Banner Image URL
            </label>
            <input
              type="url"
              value={bannerImg}
              onChange={(e) => setBannerImg(e.target.value)}
              placeholder="https://example.com/your-banner.jpg"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <Link
              href={`/profile/${profile.id}`}
              className="flex-1 rounded-lg bg-white/10 py-3 text-center font-medium text-white transition-colors hover:bg-white/20"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={updateProfile.isPending}
              className="flex-1 rounded-lg bg-emerald-600 py-3 font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
            >
              {updateProfile.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

