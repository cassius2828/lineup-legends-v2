"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "~/trpc/react";
import Image from "next/image";

function FollowButton({
  targetUserId,
  sessionUserId,
}: {
  targetUserId: string;
  sessionUserId: string | undefined;
}) {
  const utils = api.useUtils();
  const { data: followStatus } = api.follow.isFollowing.useQuery(
    { targetUserId },
    { enabled: !!sessionUserId && sessionUserId !== targetUserId },
  );
  const toggleFollow = api.follow.toggleFollow.useMutation({
    onSuccess: () => {
      void utils.follow.isFollowing.invalidate({ targetUserId });
      void utils.follow.searchUsers.invalidate();
    },
  });

  if (!sessionUserId || sessionUserId === targetUserId) return null;

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFollow.mutate({ targetUserId });
      }}
      disabled={toggleFollow.isPending}
      className={`shrink-0 rounded-lg px-4 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${followStatus?.following
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
  );
}

export default function UserSearchPage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const { data: session } = api.profile.getMe.useQuery(undefined, {
    retry: false,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: users, isLoading } = api.follow.searchUsers.useQuery(
    { query: debouncedQuery },
    { enabled: debouncedQuery.length >= 1 },
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-surface-950 via-surface-800 to-surface-950">
      <div className="container mx-auto max-w-2xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Find Users</h1>
          <p className="mt-2 text-foreground/60">
            Search for users by name or username
          </p>
        </div>

        {/* Search Input */}
        <div className="relative mb-8">
          <svg
            className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground/40"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or username..."
            className="w-full rounded-xl border border-foreground/10 bg-foreground/5 py-3.5 pl-12 pr-4 text-foreground placeholder-foreground/40 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
            autoFocus
          />
        </div>

        {/* Results */}
        <div className="space-y-2">
          {!debouncedQuery && (
            <div className="rounded-2xl bg-foreground/5 p-12 text-center">
              <svg
                className="mx-auto mb-4 h-12 w-12 text-foreground/20"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <p className="text-foreground/50">
                Start typing to search for users
              </p>
            </div>
          )}

          {isLoading && debouncedQuery && (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-foreground/20 border-t-gold" />
            </div>
          )}

          {debouncedQuery && !isLoading && users?.length === 0 && (
            <div className="rounded-2xl bg-foreground/5 p-12 text-center">
              <p className="text-foreground/50">
                No users found for &ldquo;{debouncedQuery}&rdquo;
              </p>
            </div>
          )}

          {users?.map((user) => (
            <Link
              key={user.id}
              href={`/profile/${user.id}`}
              className="flex items-center gap-4 rounded-xl bg-foreground/5 p-4 transition-colors hover:bg-foreground/10"
            >
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-surface-700">
                <Image
                  width={48}
                  height={48}
                  src={
                    user.image ?? user.profileImg ?? "/default-avatar.png"
                  }
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
                <p className="text-xs text-foreground/40">
                  {user.followerCount ?? 0} followers
                </p>
              </div>
              <FollowButton
                targetUserId={user.id}
                sessionUserId={session?.id}
              />
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
