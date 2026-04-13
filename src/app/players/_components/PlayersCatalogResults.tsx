import { useRouter } from "next/navigation";
import { PlayersCatalogGrid } from "./PlayersCatalogGrid";
import { PlayersPagination } from "./PlayersPagination";
import { PlayersShowMoreButton } from "./PlayersShowMoreButton";
import type { PlayerOutput } from "~/server/api/schemas/output";

type PlayersCatalogResultsProps = {
  players: PlayerOutput[];
  totalCount: number;
  summaryText: string | null;
  showShowMore: boolean;
  showPagination: boolean;
  currentPage: number;
  totalPages: number;
  onShowMore: () => void;
  onPageChange: (page: number) => void;
};

export function PlayersCatalogResults({
  players,
  totalCount,
  summaryText,
  showShowMore,
  showPagination,
  currentPage,
  totalPages,
  onShowMore,
  onPageChange,
}: PlayersCatalogResultsProps) {
  const router = useRouter();

  if (players.length === 0) {
    return null;
  }

  return (
    <>
      {summaryText && (
        <p className="text-foreground/50 mb-4 text-sm">{summaryText}</p>
      )}
      <PlayersCatalogGrid
        players={players}
        onPlayerClick={(id) => router.push(`/players/${id}`)}
      />
      {showShowMore && (
        <PlayersShowMoreButton
          totalCount={totalCount}
          onShowMore={onShowMore}
        />
      )}
      {showPagination && (
        <PlayersPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </>
  );
}
