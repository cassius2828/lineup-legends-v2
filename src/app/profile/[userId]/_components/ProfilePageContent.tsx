"use client";

import {
  ProfileAvatarSkeleton,
  ProfileBannerSkeleton,
  ProfileHeaderSkeleton,
  ProfileLineupsSkeleton,
  ProfileStatsGridSkeleton,
} from "~/app/_components/common/skeletons";
import { FollowListModal } from "./FollowListModal";
import { ProfileAvatarSection } from "./ProfileAvatarSection";
import { ProfileBanner } from "./ProfileBanner";
import { ProfileFeaturedLineups } from "./ProfileFeaturedLineups";
import { ProfileHeader } from "./ProfileHeader";
import { ProfileLineupsSection } from "./ProfileLineupsSection";
import { ProfileNotFound } from "./ProfileNotFound";
import { ProfileStatsGrid } from "./ProfileStatsGrid";
import { useProfilePage } from "../_hooks/useProfilePage";

export function ProfilePageContent() {
  const p = useProfilePage();

  if (!p.isLoading && !p.profile) {
    return <ProfileNotFound />;
  }

  const profile = p.profile;

  return (
    <>
      {profile ? (
        <ProfileBanner
          bannerImg={profile.bannerImg}
          isOwnProfile={p.isOwnProfile}
          onBannerUpload={(file) => void p.handleImageUpload(file, "banner")}
          uploadingBanner={p.uploadingBanner}
        />
      ) : (
        <ProfileBannerSkeleton />
      )}

      <div className="container mx-auto px-4">
        {profile ? (
          <ProfileAvatarSection
            profileImg={profile.profileImg}
            image={profile.image}
            name={profile.name}
            isOwnProfile={p.isOwnProfile}
            onProfileUpload={(file) =>
              void p.handleImageUpload(file, "profile")
            }
            uploadingProfile={p.uploadingProfile}
          />
        ) : (
          <ProfileAvatarSkeleton />
        )}

        {profile ? (
          <ProfileHeader
            profile={profile}
            session={p.session}
            isOwnProfile={p.isOwnProfile}
            followStatus={p.followStatus}
            toggleFollowPending={p.toggleFollow.isPending}
            onToggleFollow={() =>
              p.toggleFollow.mutate({ targetUserId: p.userId })
            }
            onOpenFollowers={() => p.setFollowListType("followers")}
            onOpenFollowing={() => p.setFollowListType("following")}
          />
        ) : (
          <ProfileHeaderSkeleton />
        )}

        {profile ? (
          <ProfileStatsGrid profile={profile} />
        ) : (
          <ProfileStatsGridSkeleton />
        )}

        {profile?.featuredLineups && profile.featuredLineups.length > 0 && (
          <ProfileFeaturedLineups featuredLineups={profile.featuredLineups} />
        )}

        {profile ? (
          <ProfileLineupsSection
            sort={p.sort}
            onSortChange={p.setSort}
            filters={p.filters}
            onFiltersChange={p.setFilters}
            activeFilterCount={p.activeFilterCount}
            view={p.view}
            onViewChange={p.setView}
            lineups={p.lineups}
            lineupsLoading={p.lineupsLoading}
            onLoadMore={p.handleFetchNextPage}
            isFetchingNextPage={p.isFetchingNextPage}
            hasNextPage={p.hasNextPage ?? false}
          />
        ) : (
          <ProfileLineupsSkeleton />
        )}
      </div>

      {p.followListType && (
        <FollowListModal
          userId={p.userId}
          type={p.followListType}
          onClose={() => p.setFollowListType(null)}
        />
      )}
    </>
  );
}
