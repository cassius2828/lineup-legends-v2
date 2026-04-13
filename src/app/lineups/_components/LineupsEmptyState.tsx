import type { ReactNode } from "react";
import Link from "next/link";

type LineupsEmptyStateProps = {
  icon: ReactNode;
  title: string;
  message: string;
  ctaHref: string;
  ctaLabel: string;
};

export function LineupsEmptyState({
  icon,
  title,
  message,
  ctaHref,
  ctaLabel,
}: LineupsEmptyStateProps) {
  return (
    <div className="bg-foreground/5 rounded-2xl p-12 text-center">
      <div className="bg-foreground/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
        {icon}
      </div>
      <h3 className="text-foreground mb-2 text-xl font-semibold">{title}</h3>
      <p className="text-foreground/60 mb-6">{message}</p>
      <Link
        href={ctaHref}
        className="bg-gold hover:bg-gold-light inline-flex items-center gap-2 rounded-lg px-6 py-3 font-semibold text-black transition-colors"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
