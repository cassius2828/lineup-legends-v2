export function PlayersNoResults() {
  return (
    <div className="flex h-64 flex-col items-center justify-center text-center">
      <svg
        className="text-foreground/20 mb-4 h-16 w-16"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <h3 className="text-foreground/70 text-lg font-semibold">
        No players found
      </h3>
      <p className="text-foreground/50 mt-1">
        Try a different search or filter
      </p>
    </div>
  );
}
