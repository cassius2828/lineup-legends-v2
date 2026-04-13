import { getId } from "~/lib/types";
import type { ProfileOutput } from "~/server/api/schemas/output";
import { ProfileStatCard } from "./ProfileStatCard";

type ProfileStatsGridProps = {
  profile: ProfileOutput;
};

export function ProfileStatsGrid({ profile }: ProfileStatsGridProps) {
  const highestRated = profile.stats?.highestRatedLineup;

  return (
    <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
      <ProfileStatCard
        label="Total Lineups"
        value={profile.stats?.totalLineups ?? 0}
      />
      <ProfileStatCard
        label="Avg Rating"
        value={
          profile.stats?.avgRating ? profile.stats.avgRating.toFixed(1) : "N/A"
        }
        subValue={
          profile.stats?.ratedLineupsCount
            ? `${profile.stats.ratedLineupsCount} lineup${profile.stats.ratedLineupsCount === 1 ? "" : "s"} rated`
            : undefined
        }
      />
      <ProfileStatCard
        label="Highest Rated"
        value={
          highestRated ? (highestRated.avgRating?.toFixed(1) ?? "N/A") : "N/A"
        }
        subValue={
          highestRated
            ? `${highestRated.ratingCount ?? 0} rating${highestRated.ratingCount === 1 ? "" : "s"}`
            : undefined
        }
        href={highestRated ? `/lineups/${getId(highestRated)}/rate` : undefined}
      />
      <ProfileStatCard
        label="Featured"
        value={`${profile.stats?.featuredCount ?? 0} / 3`}
      />
    </div>
  );
}
