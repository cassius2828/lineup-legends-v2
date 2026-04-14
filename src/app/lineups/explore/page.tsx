import { auth } from "~/server/auth";
import LineupsHeader from "~/app/_components/Header/LineupsHeader";
import { ExplorePageContent } from "./_components/ExplorePageContent";

export default async function ExploreLineupsPage() {
  const session = await auth();
  const isAuthenticated = !!session?.user;

  return (
    <main className="from-surface-950 via-surface-800 to-surface-950 min-h-screen bg-gradient-to-b">
      <div className="container mx-auto px-4 py-8">
        <LineupsHeader
          title="Explore Lineups"
          description="Discover lineups from the community"
          exploreLink={isAuthenticated ? "/lineups" : ""}
          createLink={isAuthenticated ? "/lineups/new" : ""}
          exploreLinkText={isAuthenticated ? "My Lineups" : ""}
          createLinkText={isAuthenticated ? "+ Create Lineup" : ""}
          extraLinks={
            isAuthenticated
              ? [{ href: "/lineups/bookmarked", label: "Bookmarked" }]
              : []
          }
        />
        <ExplorePageContent />
      </div>
    </main>
  );
}
