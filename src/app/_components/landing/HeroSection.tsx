import Link from "next/link";
import { cdnUrl } from "~/lib/cdn";

interface HeroSectionProps {
  isAuthenticated: boolean;
}

export function HeroSection({ isAuthenticated }: HeroSectionProps) {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Background Image - Mobile (Kobe dunk) */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat md:hidden"
        style={{
          backgroundImage: `url(${cdnUrl("kobe-dwight-dunk.jpg")})`,
        }}
      />
      {/* Background Image - Desktop (Jordan vs LeBron) */}
      <div
        className="absolute inset-0 hidden bg-cover bg-center bg-no-repeat md:block"
        style={{
          backgroundImage: `url(${cdnUrl("jordan-vs-lebron.png")})`,
        }}
      />
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-slate-900" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-4 text-center">
        <h1 className="font-stencil text-6xl uppercase tracking-wider text-white sm:text-8xl md:text-9xl">
          Lineup
        </h1>
        <h1 className="font-stencil -mt-2 text-6xl uppercase tracking-wider text-white sm:-mt-4 sm:text-8xl md:text-9xl">
          Legends
        </h1>

        <p className="mt-8 max-w-md text-lg text-white/80 sm:text-xl">
          Build. Share. Dominate.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          {isAuthenticated ? (
            <Link
              href="/lineups/new"
              className="rounded-none border-2 border-amber-500 bg-amber-500/10 px-10 py-4 font-stencil text-lg uppercase tracking-wide text-amber-500 transition-all hover:bg-amber-500 hover:text-black"
            >
              Create Now
            </Link>
          ) : (
            <>
              <Link
                href="/api/auth/signin"
                className="rounded-none border-2 border-white bg-white/10 px-10 py-4 font-stencil text-lg uppercase tracking-wide text-white transition-all hover:bg-white hover:text-black"
              >
                Sign Up
              </Link>
              <Link
                href="/api/auth/signin"
                className="rounded-none border-2 border-amber-500 bg-amber-500 px-10 py-4 font-stencil text-lg uppercase tracking-wide text-black transition-all hover:bg-amber-400"
              >
                Sign In
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <svg
          className="h-8 w-8 text-amber-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </div>
    </section>
  );
}

