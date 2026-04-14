import { notFound } from "next/navigation";
import { caller, HydrateClient } from "~/trpc/server";
import { auth } from "~/server/auth";

import { ProfileBanner } from "./_components/ProfileBanner";
import { ProfileAvatarSection } from "./_components/ProfileAvatarSection";
import { ProfileHeader } from "./_components/ProfileHeader";
import { ProfileStatsGrid } from "./_components/ProfileStatsGrid";
import { ProfileFeaturedLineups } from "./_components/ProfileFeaturedLineups";
import { ProfileLineupsClient } from "./_components/ProfileLineupsClient";

type Props = { params: Promise<{ userId: string }> };

export default async function ProfilePage({ params }: Props) {
  const { userId } = await params;

  const [profile, session] = await Promise.all([
    caller.profile.getById({ userId }),
    auth(),
  ]);

  if (!profile) notFound();

  const isOwnProfile = session?.user?.id === userId;

  return (
    <HydrateClient>
      <main className="from-surface-950 via-surface-800 to-surface-950 min-h-screen bg-gradient-to-b">
        <ProfileBanner
          bannerImg={profile.bannerImg}
          isOwnProfile={isOwnProfile}
        />

        <div className="container mx-auto px-4">
          <ProfileAvatarSection
            profileImg={profile.profileImg}
            image={profile.image}
            name={profile.name}
            isOwnProfile={isOwnProfile}
          />

          <ProfileHeader
            profile={profile}
            isOwnProfile={isOwnProfile}
            userId={userId}
          />

          <ProfileStatsGrid profile={profile} />

          {profile.featuredLineups && profile.featuredLineups.length > 0 && (
            <ProfileFeaturedLineups featuredLineups={profile.featuredLineups} />
          )}

          <ProfileLineupsClient
            userId={userId}
            totalLineups={profile.stats?.totalLineups}
          />
        </div>
      </main>
    </HydrateClient>
  );
}
