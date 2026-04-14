import Link from "next/link";
import { Bookmark, Settings } from "lucide-react";
import type { ProfileOutput } from "~/server/api/schemas/output";
import { ProfileHeaderInteractions } from "./ProfileHeaderInteractions";
import { FollowButtonClient } from "./FollowButtonClient";

type ProfileHeaderProps = {
  profile: ProfileOutput;
  isOwnProfile: boolean;
  userId: string;
};

export function ProfileHeader({
  profile,
  isOwnProfile,
  userId,
}: ProfileHeaderProps) {
  return (
    <div className="mb-6 flex flex-col items-center gap-4 md:flex-row md:items-start md:gap-6">
      <div className="flex-1 text-center md:text-left">
        <h1 className="text-foreground text-3xl font-bold">
          {profile.name ?? "Anonymous"}
        </h1>
        {profile.username && profile.name && (
          <p className="text-foreground/60">@{profile.username}</p>
        )}
        {profile.bio && (
          <p className="text-foreground/70 mt-2 max-w-xl">{profile.bio}</p>
        )}

        <ProfileHeaderInteractions
          userId={userId}
          followerCount={profile.followerCount ?? 0}
          followingCount={profile.followingCount ?? 0}
          isOwnProfile={isOwnProfile}
        />
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
        ) : (
          <FollowButtonClient userId={userId} />
        )}
      </div>
    </div>
  );
}
