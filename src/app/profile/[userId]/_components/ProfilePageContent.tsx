"use client";

import { FollowListModal } from "./FollowListModal";
import { ProfileAvatarSection } from "./ProfileAvatarSection";
import { ProfileBanner } from "./ProfileBanner";
import { ProfileFeaturedLineups } from "./ProfileFeaturedLineups";
import { ProfileHeader } from "./ProfileHeader";
import { ProfileLineupsSection } from "./ProfileLineupsSection";
import { ProfileLoadingState } from "./ProfileLoadingState";
import { ProfileNotFound } from "./ProfileNotFound";
import { ProfileStatsGrid } from "./ProfileStatsGrid";
import { useProfilePage } from "../_hooks/useProfilePage";

export function ProfilePageContent() {
  const p = useProfilePage();

  if (p.isLoading) {
    return <ProfileLoadingState />;
  }

  if (!p.profile) {
    return <ProfileNotFound />;
  }

  const profile = p.profile;

  return (
    <main className="from-surface-950 via-surface-800 to-surface-950 min-h-screen bg-gradient-to-b">
      <ProfileBanner
        bannerImg={profile.bannerImg}
        isOwnProfile={p.isOwnProfile}
        onBannerUpload={(file) => void p.handleImageUpload(file, "banner")}
        uploadingBanner={p.uploadingBanner}
      />

      <div className="container mx-auto px-4">
        <ProfileAvatarSection
          profileImg={profile.profileImg}
          image={profile.image}
          name={profile.name}
          isOwnProfile={p.isOwnProfile}
          onProfileUpload={(file) => void p.handleImageUpload(file, "profile")}
          uploadingProfile={p.uploadingProfile}
        />

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

        <ProfileStatsGrid profile={profile} />

        {profile.featuredLineups && profile.featuredLineups.length > 0 && (
          <ProfileFeaturedLineups featuredLineups={profile.featuredLineups} />
        )}

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
      </div>

      {p.followListType && (
        <FollowListModal
          userId={p.userId}
          type={p.followListType}
          onClose={() => p.setFollowListType(null)}
        />
      )}
    </main>
  );
}
