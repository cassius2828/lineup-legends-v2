"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

const GlobalError = ({ error, reset }: GlobalErrorProps) => {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-surface-950">
        <main className="flex min-h-screen items-center justify-center px-4">
          <div className="w-full max-w-md space-y-6 text-center">
            <div className="space-y-2">
              <h1 className="font-stencil text-4xl text-foreground uppercase">
                Something Went Wrong
              </h1>
              <p className="text-lg text-foreground/80">
                An unexpected error occurred.
              </p>
            </div>

            <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:justify-center">
              <button
                onClick={reset}
                className="cursor-pointer rounded-lg border-2 border-gold bg-gold/10 px-6 py-3 text-sm font-medium text-foreground/90 capitalize transition-all hover:bg-gold hover:text-black"
              >
                Try Again
              </button>
              <Link
                href="/"
                className="w-full rounded-lg border border-foreground/20 bg-transparent px-6 py-3 text-center text-sm font-medium text-foreground/90 capitalize transition-all hover:border-gold/50 hover:bg-gold/10 hover:text-foreground sm:w-auto"
              >
                Return Home
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
};

export default GlobalError;
