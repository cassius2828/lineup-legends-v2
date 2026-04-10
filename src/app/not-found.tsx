import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="space-y-2">
          <p className="font-stencil text-gold text-8xl">404</p>
          <h1 className="font-stencil text-foreground text-4xl uppercase">
            Page Not Found
          </h1>
          <p className="text-foreground/60 text-lg">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved.
          </p>
        </div>

        <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="border-gold bg-gold/10 hover:bg-gold text-foreground/90 rounded-none border-2 px-6 py-3 text-sm font-medium capitalize transition-all hover:text-black"
          >
            Return Home
          </Link>
          <Link
            href="/lineups/explore"
            className="hover:border-gold/50 hover:bg-gold/10 border-foreground/20 text-foreground/90 hover:text-foreground rounded-none border bg-transparent px-6 py-3 text-sm font-medium capitalize transition-all"
          >
            Explore Lineups
          </Link>
        </div>
      </div>
    </main>
  );
}
