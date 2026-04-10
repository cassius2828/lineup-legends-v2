import Link from "next/link";
import type { ReactNode } from "react";

export function AuthPageShell({
  children,
  subtitle,
  brandTitleSize = "lg",
}: {
  children: ReactNode;
  subtitle?: string;
  brandTitleSize?: "lg" | "md";
}) {
  const titleClass =
    brandTitleSize === "lg"
      ? "font-stencil text-4xl tracking-wider uppercase sm:text-5xl"
      : "font-stencil text-3xl tracking-wider uppercase";

  return (
    <main className="bg-surface-950 relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="bg-gold/[0.03] absolute top-0 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full blur-3xl" />
        <div className="bg-gold/[0.02] absolute bottom-0 left-0 h-[300px] w-[400px] rounded-full blur-3xl" />
      </div>

      <div className="from-gold/30 pointer-events-none absolute top-24 left-8 hidden h-32 w-px bg-gradient-to-b to-transparent sm:block" />
      <div className="from-gold/30 pointer-events-none absolute top-24 left-8 hidden h-px w-32 bg-gradient-to-r to-transparent sm:block" />
      <div className="from-gold/30 pointer-events-none absolute top-24 right-8 hidden h-32 w-px bg-gradient-to-b to-transparent sm:block" />
      <div className="from-gold/30 pointer-events-none absolute top-24 right-8 hidden h-px w-32 bg-gradient-to-l to-transparent sm:block" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-10 text-center">
          <Link href="/" className="group inline-block">
            <h1 className={titleClass}>
              <span className="text-gold group-hover:text-gold-light transition-colors">
                Lineup
              </span>{" "}
              <span className="text-foreground group-hover:text-foreground/90 transition-colors">
                Legends
              </span>
            </h1>
          </Link>
          {subtitle ? (
            <p className="text-foreground/50 mt-3">{subtitle}</p>
          ) : null}
        </div>
        {children}
      </div>
    </main>
  );
}
