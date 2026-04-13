"use client";

import Link from "next/link";
import { Bookmark, Settings } from "lucide-react";
import { Button } from "~/app/_components/common/ui/Button";
import type {
  ProfileMeOutput,
  ProfileOutput,
} from "~/server/api/schemas/output";

type FollowStatus = { following: boolean } | undefined;

type ProfileHeaderProps = {
  profile: ProfileOutput;
  session: ProfileMeOutput | null | undefined;
  isOwnProfile: boolean;
  followStatus: FollowStatus;
  toggleFollowPending: boolean;
  onToggleFollow: () => void;
  onOpenFollowers: () => void;
  onOpenFollowing: () => void;
};

export function ProfileHeader({
  profile,
  session,
  isOwnProfile,
  followStatus,
  toggleFollowPending,
  onToggleFollow,
  onOpenFollowers,
  onOpenFollowing,
}: ProfileHeaderProps) {
  return (
    <div className="mb-6 flex flex-col items-center gap-4 md:flex-row md:items-start md:gap-6">
      <div className="flex-1 text-center md:text-left">
        <h1 className="text-foreground text-3xl font-bold">
          {profile.name ?? profile.username ?? "Anonymous"}
        </h1>
        {profile.username && profile.name && (
          <p className="text-foreground/60">@{profile.username}</p>
        )}
        {profile.bio && (
          <p className="text-foreground/70 mt-2 max-w-xl">{profile.bio}</p>
        )}

        <div className="mt-3 flex items-center justify-center gap-4 md:justify-start">
          <button
            type="button"
            onClick={onOpenFollowers}
            className="text-foreground/70 hover:text-foreground text-sm transition-colors"
          >
            <span className="text-foreground font-semibold">
              {profile.followerCount ?? 0}
            </span>{" "}
            followers
          </button>
          <button
            type="button"
            onClick={onOpenFollowing}
            className="text-foreground/70 hover:text-foreground text-sm transition-colors"
          >
            <span className="text-foreground font-semibold">
              {profile.followingCount ?? 0}
            </span>{" "}
            following
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        {isOwnProfile ? (
          <>
            <Link
              href="/lineups/bookmarked"
              className="bg-foreground/10 text-foreground hover:bg-foreground/20 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:px-5 sm:py-2.5 sm:text-sm"
            >
              <Bookmark className="-mt-0.5 mr-1 inline-block h-3.5 w-3.5 sm:mr-1.5 sm:h-4 sm:w-4" />
              Bookmarked
            </Link>
            <Link
              href="/profile/edit"
              className="bg-foreground/10 text-foreground hover:bg-foreground/20 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:px-5 sm:py-2.5 sm:text-sm"
            >
              Edit Profile
            </Link>
            <Link
              href="/profile/settings"
              className="bg-foreground/10 text-foreground hover:bg-foreground/20 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:px-5 sm:py-2.5 sm:text-sm"
            >
              <Settings className="-mt-0.5 mr-1 inline-block h-3.5 w-3.5 sm:mr-1.5 sm:h-4 sm:w-4" />
              Settings
            </Link>
          </>
        ) : session ? (
          <Button
            onClick={onToggleFollow}
            color={followStatus?.following ? "white" : "gold"}
            variant={followStatus?.following ? "subtle" : "solid"}
            loading={toggleFollowPending}
            loadingText="..."
            className="px-5 py-2.5"
          >
            {followStatus?.following ? "Unfollow" : "Follow"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
