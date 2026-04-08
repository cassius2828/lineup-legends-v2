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
    <main className="from-surface-950 via-surface-800 to-surface-950 flex min-h-screen items-center justify-center bg-gradient-to-b px-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <h1 className="font-stencil text-foreground text-3xl uppercase">
          Something Went Wrong
        </h1>
        <p className="text-foreground/60">
          {error.message || "An unexpected error occurred."}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="border-gold bg-gold/10 text-foreground/90 hover:bg-gold cursor-pointer rounded-lg border-2 px-6 py-3 text-sm font-medium transition-all hover:text-black"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="border-foreground/20 text-foreground/90 hover:border-gold/50 hover:bg-gold/10 rounded-lg border bg-transparent px-6 py-3 text-center text-sm font-medium transition-all"
          >
            Go Home
          </Link>
        </div>
      </div>
    </main>
  );
}
