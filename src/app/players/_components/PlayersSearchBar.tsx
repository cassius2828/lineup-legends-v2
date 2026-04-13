type PlayersSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

export function PlayersSearchBar({ value, onChange }: PlayersSearchBarProps) {
  const hasValue = value.length > 0;

  return (
    <div className="relative mb-6">
      <svg
        className="text-foreground/40 absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by player name..."
        className={`border-foreground/10 bg-foreground/5 text-foreground placeholder-foreground/40 focus:border-gold focus:ring-gold w-full rounded-xl border py-3.5 pl-12 focus:ring-1 focus:outline-none ${
          hasValue ? "pr-10" : "pr-4"
        }`}
      />
      {hasValue && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="text-foreground/40 hover:text-foreground/70 absolute top-1/2 right-3 -translate-y-1/2 rounded-md p-0.5 transition-colors"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
