import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type AdminBackLinkProps = {
  href: string;
  children: React.ReactNode;
};

export function AdminBackLink({ href, children }: AdminBackLinkProps) {
  return (
    <Link
      href={href}
      className="text-foreground/60 hover:text-foreground/80 mb-4 inline-flex items-center gap-1 text-sm"
    >
      <ArrowLeft className="h-4 w-4" />
      {children}
    </Link>
  );
}
