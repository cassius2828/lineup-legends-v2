import Link from "next/link";
import { auth } from "~/server/auth";

export default async function Home() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-slate-900/80 backdrop-blur-lg">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/" className="text-2xl font-bold text-white">
            <span className="text-emerald-400">Lineup</span> Legends
          </Link>
          <div className="flex items-center gap-4">
            {session ? (
              <>
                <Link
                  href="/lineups"
                  className="text-white/70 transition-colors hover:text-white"
                >
                  My Lineups
                </Link>
                <Link
                  href="/lineups/explore"
                  className="text-white/70 transition-colors hover:text-white"
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
                  <span className="text-sm text-white/70">
                    {session.user.name}
                  </span>
                </Link>
                <Link
                  href="/api/auth/signout"
                  className="rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
                >
                  Sign Out
                </Link>
              </>
            ) : (
              <Link
                href="/api/auth/signin"
                className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-emerald-500"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex min-h-screen flex-col items-center justify-center px-4 pt-20">
        <div className="text-center">
          <h1 className="mb-6 text-5xl font-extrabold tracking-tight text-white sm:text-7xl">
            Build Your
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Dream Lineup
            </span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-white/60 sm:text-xl">
            Create, share, and compete with fantasy basketball lineups. Start
            with a $15 budget, pick 5 players, and show the world your GM
            skills.
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            {session ? (
              <>
                <Link
                  href="/lineups/new"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-emerald-600/30 transition-all hover:bg-emerald-500 hover:shadow-emerald-600/40"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Create Lineup
                </Link>
                <Link
                  href="/lineups/explore"
                  className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-white/20"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  Explore Lineups
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/api/auth/signin"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-emerald-600/30 transition-all hover:bg-emerald-500 hover:shadow-emerald-600/40"
                >
                  Get Started
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </Link>
                <Link
                  href="/lineups/explore"
                  className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-white/20"
                >
                  Browse Lineups
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 grid max-w-5xl gap-6 px-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white/5 p-6 backdrop-blur-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600/20">
              <svg
                className="h-6 w-6 text-emerald-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-semibold text-white">
              $15 Budget
            </h3>
            <p className="text-white/60">
              Strategically build your lineup with a limited budget. Every
              dollar counts!
            </p>
          </div>

          <div className="rounded-2xl bg-white/5 p-6 backdrop-blur-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-600/20">
              <svg
                className="h-6 w-6 text-cyan-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-semibold text-white">
              200+ Players
            </h3>
            <p className="text-white/60">
              Choose from over 200 unique players valued from $1 to $5.
            </p>
          </div>

          <div className="rounded-2xl bg-white/5 p-6 backdrop-blur-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-600/20">
              <svg
                className="h-6 w-6 text-amber-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-semibold text-white">
              Feature Lineups
            </h3>
            <p className="text-white/60">
              Showcase your best lineups and share them with the community.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
