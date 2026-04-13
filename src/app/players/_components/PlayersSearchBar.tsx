import { Search, X } from "lucide-react";

type PlayersSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

export function PlayersSearchBar({ value, onChange }: PlayersSearchBarProps) {
  const hasValue = value.length > 0;

  return (
    <div className="relative mb-6">
      <Search className="text-foreground/40 absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2" />
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
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
