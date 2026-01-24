import Link from "next/link";
import { auth } from "~/server/auth";
import {
  HeroSection,
  WelcomeSection,
  RatingSection,
  CommentingSection,
  FriendsSection,
  GambleSection,
  ShareSection,
  FeaturedSection,
  Footer,
} from "./_components/landing";

export default async function Home() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-black/80 backdrop-blur-lg">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/" className="font-stencil text-2xl uppercase tracking-wide text-white">
            <span className="text-amber-500">Lineup</span> Legends
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/lineups/new"
              className="hidden text-white/70 transition-colors hover:text-white sm:block"
            >
              create a lineup
            </Link>
            {session ? (
              <>
                <Link
                  href="/lineups"
                  className="hidden text-white/70 transition-colors hover:text-white sm:block"
                >
                  My Lineups
                </Link>
                <Link
                  href="/lineups/explore"
                  className="hidden text-white/70 transition-colors hover:text-white sm:block"
                >
                  Explore
                </Link>
                <Link
                  href={`/profile/${session.user.id}`}
                  className="flex items-center gap-2 transition-opacity hover:opacity-80"
                >
                  {session.user.image && (
                    <img
                      src={session.user.image}
                      alt={session.user.name ?? "User"}
                      className="h-8 w-8 rounded-full"
                    />
                  )}
                  <span className="hidden text-sm text-white/70 sm:block">
                    {session.user.name}
                  </span>
                </Link>
                <Link
                  href="/api/auth/signout"
                  className="rounded-none border border-white/30 bg-transparent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
                >
                  Sign Out
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/api/auth/signin"
                  className="text-white/70 transition-colors hover:text-white"
                >
                  Sign up
                </Link>
                <Link
                  href="/api/auth/signin"
                  className="rounded-none border-2 border-amber-600 bg-amber-600/20 px-4 py-2 text-sm font-medium text-amber-500 transition-colors hover:bg-amber-600 hover:text-black"
                >
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Landing Page Sections */}
      <HeroSection isAuthenticated={!!session} />
      <WelcomeSection />
      <RatingSection />
      <CommentingSection />
      <FriendsSection />
      <GambleSection />
      <ShareSection />
      <FeaturedSection />
      <Footer />
    </main>
  );
}
