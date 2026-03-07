"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-surface-950 via-surface-800 to-surface-950 px-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <h1 className="font-stencil text-3xl uppercase text-foreground">
          Something Went Wrong
        </h1>
        <p className="text-foreground/60">{error.message || "An unexpected error occurred."}</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="cursor-pointer rounded-lg border-2 border-gold bg-gold/10 px-6 py-3 text-sm font-medium text-foreground/90 transition-all hover:bg-gold hover:text-black"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="rounded-lg border border-foreground/20 bg-transparent px-6 py-3 text-center text-sm font-medium text-foreground/90 transition-all hover:border-gold/50 hover:bg-gold/10"
          >
            Go Home
          </Link>
        </div>
      </div>
    </main>
  );
}
