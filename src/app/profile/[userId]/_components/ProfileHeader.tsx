"use client";

import Link from "next/link";
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
              <svg
                className="-mt-0.5 mr-1 inline-block h-3.5 w-3.5 sm:mr-1.5 sm:h-4 sm:w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
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
              <svg
                className="-mt-0.5 mr-1 inline-block h-3.5 w-3.5 sm:mr-1.5 sm:h-4 sm:w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
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
