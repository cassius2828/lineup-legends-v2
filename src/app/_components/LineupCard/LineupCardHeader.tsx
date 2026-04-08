"use client";

import Link from "next/link";
import Image from "next/image";
import type { LineupOutput } from "~/server/api/schemas/output";

interface LineupCardHeaderProps {
  lineup: LineupOutput;
  showOwner?: boolean;
  totalValue: number;
  relativeTime: string;
}

export function LineupCardHeader({
  lineup,
  showOwner = true,
  totalValue,
  relativeTime,
}: LineupCardHeaderProps) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {showOwner && lineup.owner && (
          <Link
            href={`/profile/${lineup.owner._id?.toString() ?? ""}`}
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            {lineup.owner.image && (
              <Image
                width={32}
                height={32}
                src={lineup.owner?.image ?? lineup.owner?.profileImg ?? ""}
                alt={lineup.owner?.name ?? "User"}
                className="rounded-full"
              />
            )}
            <span className="text-foreground/90 hover:text-foreground font-medium">
              {lineup.owner?.name ?? lineup.owner?.username ?? "Anonymous"}
            </span>
          </Link>
        )}
        {lineup.featured && (
          <span className="bg-gold/20 text-gold rounded-full px-2 py-0.5 text-xs font-semibold">
            Featured
          </span>
        )}
      </div>
      <div className="text-foreground/50 flex items-center gap-2 text-sm">
        <span>{relativeTime}</span>
        <span className="bg-foreground/10 text-foreground rounded-full px-2 py-1 font-semibold">
          ${totalValue} value
        </span>
      </div>
    </div>
  );
}
