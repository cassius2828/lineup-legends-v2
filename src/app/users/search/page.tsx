"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "~/trpc/react";
import { Button } from "~/app/_components/common/ui/Button";
import Image from "next/image";
import { Search, Users } from "lucide-react";

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
    <Button
      onClick={() => {
        toggleFollow.mutate({ targetUserId });
      }}
      color={followStatus?.following ? "white" : "gold"}
      variant={followStatus?.following ? "subtle" : "solid"}
      loading={toggleFollow.isPending}
      loadingText="..."
      className="shrink-0"
    >
      {followStatus?.following ? "Unfollow" : "Follow"}
    </Button>
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
    <main className="from-surface-950 via-surface-800 to-surface-950 min-h-screen bg-gradient-to-b">
      <div className="container mx-auto max-w-2xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-foreground text-3xl font-bold">Find Users</h1>
          <p className="text-foreground/60 mt-2">
            Search for users by name or username
          </p>
        </div>

        {/* Search Input */}
        <div className="relative mb-8">
          <Search className="text-foreground/40 absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or username..."
            className="border-foreground/10 bg-foreground/5 text-foreground placeholder-foreground/40 focus:border-gold focus:ring-gold w-full rounded-xl border py-3.5 pr-4 pl-12 focus:ring-1 focus:outline-none"
            autoFocus
          />
        </div>

        {/* Results */}
        <div className="space-y-2">
          {!debouncedQuery && (
            <div className="bg-foreground/5 rounded-2xl p-12 text-center">
              <Users className="text-foreground/20 mx-auto mb-4 h-12 w-12" />
              <p className="text-foreground/50">
                Start typing to search for users
              </p>
            </div>
          )}

          {isLoading && debouncedQuery && (
            <div className="flex items-center justify-center py-12">
              <div className="border-foreground/20 border-t-gold h-8 w-8 animate-spin rounded-full border-2" />
            </div>
          )}

          {debouncedQuery && !isLoading && users?.length === 0 && (
            <div className="bg-foreground/5 rounded-2xl p-12 text-center">
              <p className="text-foreground/50">
                No users found for &ldquo;{debouncedQuery}&rdquo;
              </p>
            </div>
          )}

          {users?.map((user) => (
            <Link
              key={user.id}
              href={`/profile/${user.id}`}
              className="bg-foreground/5 hover:bg-foreground/10 flex items-center gap-4 rounded-xl p-4 transition-colors"
            >
              <div className="bg-surface-700 h-12 w-12 shrink-0 overflow-hidden rounded-full">
                <Image
                  width={48}
                  height={48}
                  src={user.image ?? user.profileImg ?? "/default-user.jpg"}
                  alt={user.name ?? "User"}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-foreground truncate font-medium">
                  {user.name}
                </p>
                {user.username && (
                  <p className="text-foreground/50 truncate text-sm">
                    @{user.username}
                  </p>
                )}
                <p className="text-foreground/40 text-xs">
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
