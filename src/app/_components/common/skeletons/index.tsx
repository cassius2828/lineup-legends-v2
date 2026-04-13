/** Named skeleton placeholders for loading states — add new exports here as needed. */

export function LineupCardSkeleton() {
  return (
    <div className="from-surface-800/90 to-surface-950/90 animate-pulse rounded-2xl bg-gradient-to-br p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-foreground/10 h-10 w-10 rounded-full" />
          <div className="space-y-1.5">
            <div className="bg-foreground/10 h-3.5 w-28 rounded" />
            <div className="bg-foreground/10 h-3 w-20 rounded" />
          </div>
        </div>
        <div className="bg-foreground/10 h-6 w-16 rounded-full" />
      </div>
      <div className="mt-3 flex items-center gap-4">
        <div className="bg-foreground/10 h-4 w-24 rounded" />
        <div className="bg-foreground/10 h-4 w-20 rounded" />
      </div>
      <div className="mt-4 flex justify-between px-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <div className="bg-foreground/10 h-3 w-5 rounded" />
            <div className="bg-foreground/10 h-16 w-16 rounded-full" />
            <div className="bg-foreground/10 h-3 w-14 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
