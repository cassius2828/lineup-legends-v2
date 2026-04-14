import LineupsHeader from "~/app/_components/Header/LineupsHeader";
import { BookmarkedPageContent } from "./_components/BookmarkedPageContent";

export default function BookmarkedLineupsPage() {
  return (
    <main className="from-surface-950 via-surface-800 to-surface-950 min-h-screen bg-gradient-to-b">
      <div className="container mx-auto px-4 py-8">
        <LineupsHeader
          title="Bookmarked Lineups"
          description="Lineups you've saved for later"
          exploreLink="/lineups/explore"
          createLink="/lineups/new"
          exploreLinkText="Explore Lineups"
          createLinkText="+ Create Lineup"
        />
        <BookmarkedPageContent />
      </div>
    </main>
  );
}
