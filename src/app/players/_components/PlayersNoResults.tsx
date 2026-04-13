import { Search } from "lucide-react";

export function PlayersNoResults() {
  return (
    <div className="flex h-64 flex-col items-center justify-center text-center">
      <Search className="text-foreground/20 mb-4 h-16 w-16" strokeWidth={1.5} />
      <h3 className="text-foreground/70 text-lg font-semibold">
        No players found
      </h3>
      <p className="text-foreground/50 mt-1">
        Try a different search or filter
      </p>
    </div>
  );
}
