"use client";

import { useParams, useRouter } from "next/navigation";
import { useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { LineupCard } from "~/app/_components/LineupCard/LineupCard";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { getId } from "~/lib/types";

function FollowListModal({
  userId,
  type,
  onClose,
}: {
  userId: string;
  type: "followers" | "following";
  onClose: () => void;
}) {
  const { data: followers } = api.follow.getFollowers.useQuery(
    { userId },
    { enabled: type === "followers" },
  );
  const { data: following } = api.follow.getFollowing.useQuery(
    { userId },
    { enabled: type === "following" },
  );
  const router = useRouter();

  const items =
    type === "followers" ? followers?.items : following?.items;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-surface-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground capitalize">
            {type}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-foreground/60 hover:bg-foreground/10 hover:text-foreground"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="max-h-80 space-y-2 overflow-y-auto">
          {!items || items.length === 0 ? (
            <p className="py-8 text-center text-foreground/50">
              No {type} yet
            </p>
          ) : (
            items.map((item) => {
              const user = item.user as any;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onClose();
                    router.push(`/profile/${user._id?.toString() ?? user.id}`);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-foreground/5"
                >
                  <div className="h-10 w-10 overflow-hidden rounded-full bg-surface-700">
                    <Image
                      width={40}
                      height={40}
                      src={user.profileImg ?? user.image ?? "/default-avatar.png"}
                      alt={user.name ?? "User"}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">
                      {user.name}
                    </p>
                    {user.username && (
                      <p className="truncate text-sm text-foreground/50">
                        @{user.username}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-foreground/40">
                    {user.followerCount ?? 0} followers
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function ImageUploadOverlay({
  onUpload,
  isUploading,
  type,
}: {
  onUpload: (file: File) => void;
  isUploading: boolean;
  type: "profile" | "banner";
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className={`absolute inset-0 flex items-center justify-center bg-black/0 transition-all hover:bg-black/40 ${
          type === "profile" ? "rounded-full" : ""
        }`}
        title={`Change ${type} image`}
      >
        <span className="rounded-full bg-black/60 p-2 opacity-0 transition-opacity group-hover:opacity-100">
          {isUploading ? (
            <svg className="h-5 w-5 animate-spin text-foreground" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="h-5 w-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </span>
      </button>
    </>
  );
}

function StatCard({
  label,
  value,
  subValue,
  href,
}: {
  label: string;
  value: string | number;
  subValue?: string;
  href?: string;
}) {
  const content = (
    <div className="rounded-xl bg-foreground/5 p-4 text-center transition-colors hover:bg-foreground/10">
      <p className="text-2xl font-bold text-gold-300">{value}</p>
      <p className="mt-1 text-sm text-foreground/60">{label}</p>
      {subValue && (
        <p className="mt-0.5 truncate text-xs text-foreground/40">{subValue}</p>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

export default function ProfilePage() {
  const params = useParams();
  const userId = params.userId as string;
  const utils = api.useUtils();

  const { data: profile, isLoading } = api.profile.getById.useQuery({ userId });
  const { data: session } = api.profile.getMe.useQuery(undefined, {
    retry: false,
  });
  const { data: followStatus } = api.follow.isFollowing.useQuery(
    { targetUserId: userId },
    { enabled: !!session && session.id !== userId },
  );

  const toggleFollow = api.follow.toggleFollow.useMutation({
    onSuccess: () => {
      void utils.follow.isFollowing.invalidate({ targetUserId: userId });
      void utils.profile.getById.invalidate({ userId });
    },
  });

  const updateProfile = api.profile.update.useMutation({
    onSuccess: () => {
      void utils.profile.getById.invalidate({ userId });
      void utils.profile.getMe.invalidate();
    },
  });

  const isOwnProfile = session?.id === userId;
  const [followListType, setFollowListType] = useState<
    "followers" | "following" | null
  >(null);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const handleImageUpload = useCallback(
    async (file: File, type: "profile" | "banner") => {
      const setter = type === "profile" ? setUploadingProfile : setUploadingBanner;
      setter(true);

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

        if (type === "profile") {
          updateProfile.mutate({ profileImg: url });
        } else {
          updateProfile.mutate({ bannerImg: url });
        }
      } catch (error) {
        console.error("Upload error:", error);
        toast.error(error instanceof Error ? error.message : "Failed to upload image");
      } finally {
        setter(false);
      }
    },
    [updateProfile],
  );

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-surface-950 via-surface-800 to-surface-950">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-foreground/20 border-t-gold" />
            <p className="text-foreground/60">Loading profile...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-surface-950 via-surface-800 to-surface-950">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground">User not found</h1>
          <Link href="/" className="mt-4 text-gold-300 hover:underline">
            Go home
          </Link>
        </div>
      </main>
    );
  }

  const highestRated = profile.stats?.highestRatedLineup;

  return (
    <main className="min-h-screen bg-gradient-to-b from-surface-950 via-surface-800 to-surface-950">
      {/* Banner */}
      <div
        className="group relative h-48 bg-cover bg-center md:h-64"
        style={{
          backgroundImage: profile.bannerImg
            ? `url(${profile.bannerImg})`
            : "linear-gradient(135deg, #059669, #0891b2, #6366f1)",
        }}
      >
        {isOwnProfile && (
          <ImageUploadOverlay
            onUpload={(file) => handleImageUpload(file, "banner")}
            isUploading={uploadingBanner}
            type="banner"
          />
        )}
      </div>

      <div className="container mx-auto px-4">
        {/* Profile Header */}
        <div className="relative -mt-16 mb-6 flex flex-col items-center gap-4 md:flex-row md:items-end md:gap-6">
          {/* Avatar */}
          <div className="group relative h-32 w-32 overflow-hidden rounded-full border-4 border-surface-950 bg-surface-800">
            <Image
              width={128}
              height={128}
              src={profile.profileImg ?? profile.image ?? "/default-avatar.png"}
              alt={profile.name ?? "User"}
              className="h-full w-full object-cover"
            />
            {isOwnProfile && (
              <ImageUploadOverlay
                onUpload={(file) => handleImageUpload(file, "profile")}
                isUploading={uploadingProfile}
                type="profile"
              />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold text-foreground">
              {profile.name ?? profile.username ?? "Anonymous"}
            </h1>
            {profile.username && profile.name && (
              <p className="text-foreground/60">@{profile.username}</p>
            )}
            {profile.bio && (
              <p className="mt-2 max-w-xl text-foreground/70">{profile.bio}</p>
            )}

            {/* Follower / Following counts */}
            <div className="mt-3 flex items-center justify-center gap-4 md:justify-start">
              <button
                onClick={() => setFollowListType("followers")}
                className="text-sm text-foreground/70 transition-colors hover:text-foreground"
              >
                <span className="font-semibold text-foreground">
                  {profile.followerCount ?? 0}
                </span>{" "}
                followers
              </button>
              <button
                onClick={() => setFollowListType("following")}
                className="text-sm text-foreground/70 transition-colors hover:text-foreground"
              >
                <span className="font-semibold text-foreground">
                  {profile.followingCount ?? 0}
                </span>{" "}
                following
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {isOwnProfile ? (
              <>
                <Link
                  href="/lineups/bookmarked"
                  className="rounded-lg bg-foreground/10 px-5 py-2.5 font-medium text-foreground transition-colors hover:bg-foreground/20"
                >
                  <svg className="inline-block h-4 w-4 mr-1.5 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  Bookmarked
                </Link>
                <Link
                  href="/profile/edit"
                  className="rounded-lg bg-foreground/10 px-5 py-2.5 font-medium text-foreground transition-colors hover:bg-foreground/20"
                >
                  Edit Profile
                </Link>
                <Link
                  href="/profile/settings"
                  className="rounded-lg bg-foreground/10 px-5 py-2.5 font-medium text-foreground transition-colors hover:bg-foreground/20"
                >
                  <svg className="inline-block h-4 w-4 mr-1.5 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </Link>
              </>
            ) : session ? (
              <button
                onClick={() => toggleFollow.mutate({ targetUserId: userId })}
                disabled={toggleFollow.isPending}
                className={`rounded-lg px-5 py-2.5 font-medium transition-colors disabled:opacity-50 ${
                  followStatus?.following
                    ? "bg-foreground/10 text-foreground hover:bg-red-500/20 hover:text-red-400"
                    : "bg-gold text-black hover:bg-gold-light"
                }`}
              >
                {toggleFollow.isPending
                  ? "..."
                  : followStatus?.following
                    ? "Unfollow"
                    : "Follow"}
              </button>
            ) : null}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            label="Total Lineups"
            value={profile.stats?.totalLineups ?? 0}
          />
          <StatCard
            label="Avg Rating"
            value={profile.stats?.avgRating ? profile.stats.avgRating.toFixed(1) : "N/A"}
          />
          <StatCard
            label="Highest Rated"
            value={
              highestRated
                ? (highestRated as any).avgRating?.toFixed(1) ?? "N/A"
                : "N/A"
            }
            subValue={
              highestRated
                ? `${(highestRated as any).ratingCount ?? 0} ratings`
                : undefined
            }
            href={
              highestRated ? `/lineups/${getId(highestRated)}/rate` : undefined
            }
          />
          <StatCard
            label="Featured"
            value={`${profile.stats?.featuredCount ?? 0} / 3`}
          />
        </div>

        {/* Featured Lineups */}
        {profile.featuredLineups && profile.featuredLineups.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-foreground">
              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Featured Lineups
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {profile.featuredLineups.map((lineup: any) => (
                <LineupCard
                  key={getId(lineup)}
                  lineup={{
                    ...lineup,
                    owner: {
                      id: getId(profile),
                      name: profile.name,
                      username: profile.username,
                      image: profile.profileImg ?? profile.image,
                      email: undefined,
                      emailVerified: null,
                      bio: profile.bio,
                      profileImg: profile.profileImg,
                      bannerImg: profile.bannerImg,
                    },
                  } as any}
                  showOwner={false}
                  isOwner={false}
                  featured
                />
              ))}
            </div>
          </div>
        )}

        {profile.featuredLineups && profile.featuredLineups.length > 0 && (
          <hr className="mb-8 border-t border-gold/40" />
        )}

        {/* Recent Lineups Section */}
        <div className="pb-16">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Recent Lineups</h2>
            {profile.lineups.length > 0 && (
              <span className="text-sm text-foreground/50">
                Showing {profile.lineups.length} of{" "}
                {profile.stats?.totalLineups ?? profile._count.lineups}
              </span>
            )}
          </div>

          {profile.lineups.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {profile.lineups.map((lineup: any) => (
                <LineupCard
                  key={getId(lineup)}
                  lineup={{
                    ...lineup,
                    owner: {
                      id: getId(profile),
                      name: profile.name,
                      username: profile.username,
                      image: profile.profileImg ?? profile.image,
                      email: undefined,
                      emailVerified: null,
                      bio: profile.bio,
                      profileImg: profile.profileImg,
                      bannerImg: profile.bannerImg,
                    },
                  } as any}
                  showOwner={false}
                  isOwner={false}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-foreground/5 p-12 text-center">
              <p className="text-foreground/60">No lineups yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Follow List Modal */}
      {followListType && (
        <FollowListModal
          userId={userId}
          type={followListType}
          onClose={() => setFollowListType(null)}
        />
      )}
    </main>
  );
}
