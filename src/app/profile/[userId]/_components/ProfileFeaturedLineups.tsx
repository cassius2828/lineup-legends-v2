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
          <svg
            className="h-5 w-5 text-yellow-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
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
