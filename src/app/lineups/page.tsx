import LineupsHeader from "~/app/_components/Header/LineupsHeader";
import { MyLineupsPageContent } from "./_components/MyLineupsPageContent";

export default function MyLineupsPage() {
  return (
    <main className="from-surface-950 via-surface-800 to-surface-950 min-h-screen bg-gradient-to-b">
      <div className="container mx-auto px-4 py-8">
        <LineupsHeader
          title="My Lineups"
          description="Manage your fantasy basketball lineups"
          exploreLink="/lineups/explore"
          createLink="/lineups/new"
          exploreLinkText="Explore Lineups"
          createLinkText="+ Create Lineup"
          extraLinks={[{ href: "/lineups/bookmarked", label: "Bookmarked" }]}
        />
        <MyLineupsPageContent />
      </div>
    </main>
  );
}
