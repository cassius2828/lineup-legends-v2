import Link from "next/link";

export default function LineupNotFound() {
  return (
    <main className="from-surface-950 via-surface-800 to-surface-950 min-h-screen bg-gradient-to-b">
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-foreground text-2xl font-bold">Lineup not found</h1>
        <Link
          href="/lineups/explore"
          className="text-gold-300 mt-4 hover:underline"
        >
          Explore lineups
        </Link>
      </div>
    </main>
  );
}
