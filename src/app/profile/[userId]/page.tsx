"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { LineupCard } from "~/app/_components/LineupCard";
import { api } from "~/trpc/react";
import { getId } from "~/lib/types";

export default function ProfilePage() {
  const params = useParams();
  const userId = params.userId as string;

  const { data: profile, isLoading } = api.profile.getById.useQuery({ userId });
  const { data: session } = api.profile.getMe.useQuery(undefined, {
    retry: false,
  });

  const isOwnProfile = session?.id === userId;

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-emerald-500" />
            <p className="text-white/60">Loading profile...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-white">User not found</h1>
          <Link href="/" className="mt-4 text-emerald-400 hover:underline">
            Go home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Banner */}
      <div
        className="h-48 bg-cover bg-center md:h-64"
        style={{
          backgroundImage: profile.bannerImg
            ? `url(${profile.bannerImg})`
            : "linear-gradient(to right, #059669, #0891b2)",
        }}
      />

      <div className="container mx-auto px-4">
        {/* Profile Header */}
        <div className="relative -mt-16 mb-8 flex flex-col items-center gap-4 md:flex-row md:items-end md:gap-6">
          {/* Avatar */}
          <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-slate-900 bg-slate-800">
            <img
              src={profile.profileImg ?? profile.image ?? "/default-avatar.png"}
              alt={profile.name ?? "User"}
              className="h-full w-full object-cover"
            />
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold text-white">
              {profile.name ?? profile.username ?? "Anonymous"}
            </h1>
            {profile.username && profile.name && (
              <p className="text-white/60">@{profile.username}</p>
            )}
            {profile.bio && (
              <p className="mt-2 max-w-xl text-white/70">{profile.bio}</p>
            )}
            <p className="mt-2 text-sm text-white/50">
              {profile._count.lineups} lineup{profile._count.lineups !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Edit Button */}
          {isOwnProfile && (
            <Link
              href="/profile/edit"
              className="rounded-lg bg-white/10 px-4 py-2 font-medium text-white transition-colors hover:bg-white/20"
            >
              Edit Profile
            </Link>
          )}
        </div>

        {/* Lineups Section */}
        <div className="pb-16">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Recent Lineups</h2>
            {profile.lineups.length > 0 && (
              <span className="text-sm text-white/50">
                Showing {profile.lineups.length} of {profile._count.lineups}
              </span>
            )}
          </div>

          {profile.lineups.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {profile.lineups.map((lineup) => (
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
            <div className="rounded-2xl bg-white/5 p-12 text-center">
              <p className="text-white/60">No lineups yet</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

