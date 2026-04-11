"use client";

import Link from "next/link";
import { Button } from "~/app/_components/ui/Button";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

const GlobalError = ({ error, reset }: GlobalErrorProps) => {
  console.error(error);

  return (
    <html lang="en">
      <body className="bg-surface-950">
        <main className="flex min-h-screen items-center justify-center px-4">
          <div className="w-full max-w-md space-y-6 text-center">
            <div className="space-y-2">
              <h1 className="font-stencil text-foreground text-4xl uppercase">
                Something Went Wrong
              </h1>
              <p className="text-foreground/80 text-lg">
                An unexpected error occurred.
              </p>
            </div>

            <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:justify-center">
              <Button
                onClick={reset}
                color="gold"
                variant="subtle"
                className="px-6 py-3"
              >
                Try Again
              </Button>
              <Link
                href="/"
                className="border-foreground/20 text-foreground/90 hover:border-gold/50 hover:bg-gold/10 hover:text-foreground w-full rounded-lg border bg-transparent px-6 py-3 text-center text-sm font-medium capitalize transition-all sm:w-auto"
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
