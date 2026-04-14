import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { NewLineupPageContent } from "./_components/NewLineupPageContent";

export default function CreateLineupPage() {
  return (
    <main className="bg-surface-950 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <Link
          href="/lineups"
          className="text-foreground/60 hover:text-foreground/80 mb-4 inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to My Lineups
        </Link>

        <NewLineupPageContent />
      </div>
    </main>
  );
}
