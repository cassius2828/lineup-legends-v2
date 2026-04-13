import { StarFilledIcon } from "~/app/_components/common/icons";
import { LineupCard } from "~/app/_components/LineupCard/LineupCard";
import { getId } from "~/lib/types";
import type { ProfileOutput } from "~/server/api/schemas/output";

type ProfileFeaturedLineupsProps = {
  featuredLineups: NonNullable<ProfileOutput["featuredLineups"]>;
};

export function ProfileFeaturedLineups({
  featuredLineups,
}: ProfileFeaturedLineupsProps) {
  if (!featuredLineups.length) return null;

  return (
    <>
      <div className="mb-8">
        <h2 className="text-foreground mb-4 flex items-center gap-2 text-xl font-semibold">
          <StarFilledIcon className="h-5 w-5 text-yellow-400" />
          Featured Lineups
        </h2>
        <div
          className={`grid grid-cols-1 gap-6 ${featuredLineups.length >= 3 ? "md:grid-cols-2 lg:grid-cols-3" : featuredLineups.length === 2 ? "md:grid-cols-2" : ""}`}
        >
          {featuredLineups.map((lineup) => (
            <LineupCard
              key={getId(lineup)}
              lineup={lineup}
              showOwner={false}
              isOwner={false}
              featured
            />
          ))}
        </div>
      </div>
      <hr className="border-gold/40 mb-8 border-t" />
    </>
  );
}
