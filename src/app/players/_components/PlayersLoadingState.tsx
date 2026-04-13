export function PlayersLoadingState() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="text-center">
        <div className="border-foreground/20 border-t-gold mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4" />
        <p className="text-foreground/60">Loading players...</p>
      </div>
    </div>
  );
}
