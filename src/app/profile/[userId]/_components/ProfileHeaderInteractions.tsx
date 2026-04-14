"use client";

import { useState } from "react";
import { FollowListModal } from "./FollowListModal";

type ProfileHeaderInteractionsProps = {
  userId: string;
  followerCount: number;
  followingCount: number;
  isOwnProfile: boolean;
};

export function ProfileHeaderInteractions({
  userId,
  followerCount,
  followingCount,
}: ProfileHeaderInteractionsProps) {
  const [followListType, setFollowListType] = useState<
    "followers" | "following" | null
  >(null);

  return (
    <>
      <div className="mt-3 flex items-center justify-center gap-4 md:justify-start">
        <button
          type="button"
          onClick={() => setFollowListType("followers")}
          className="text-foreground/70 hover:text-foreground text-sm transition-colors"
        >
          <span className="text-foreground font-semibold">{followerCount}</span>{" "}
          followers
        </button>
        <button
          type="button"
          onClick={() => setFollowListType("following")}
          className="text-foreground/70 hover:text-foreground text-sm transition-colors"
        >
          <span className="text-foreground font-semibold">
            {followingCount}
          </span>{" "}
          following
        </button>
      </div>

      {followListType && (
        <FollowListModal
          userId={userId}
          type={followListType}
          onClose={() => setFollowListType(null)}
        />
      )}
    </>
  );
}
