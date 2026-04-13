type PlayersShowMoreButtonProps = {
  totalCount: number;
  onShowMore: () => void;
};

export function PlayersShowMoreButton({
  totalCount,
  onShowMore,
}: PlayersShowMoreButtonProps) {
  return (
    <div className="mt-8 flex justify-center">
      <button
        type="button"
        onClick={onShowMore}
        className="border-foreground/10 bg-foreground/5 text-foreground hover:bg-foreground/10 rounded-xl border px-8 py-3 text-sm font-medium transition-colors"
      >
        Show all {totalCount} players
      </button>
    </div>
  );
}
