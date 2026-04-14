"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import { LineupCard } from "~/app/_components/LineupCard/LineupCard";
import { LineupDetailSkeleton } from "~/app/_components/common/skeletons";
import { LineupCommentsClient } from "./LineupCommentsClient";

export function LineupDetailClient() {
  const params = useParams();
  const rawId = params?.id;
  const lineupId =
    typeof rawId === "string"
      ? rawId
      : Array.isArray(rawId)
        ? (rawId[0] ?? "")
        : "";

  const { data: lineup, isLoading } = api.lineup.getLineupById.useQuery({
    id: lineupId,
  });

  const { data: session } = api.profile.getMe.useQuery(undefined, {
    retry: false,
  });

  if (isLoading) {
    return <LineupDetailSkeleton />;
  }

  if (!lineup) {
    return (
      <div className="text-foreground/50 p-12 text-center">
        Lineup not found
      </div>
    );
  }

  return (
    <>
      <Link
        href="/lineups"
        className="text-foreground/40 hover:text-foreground/70 mb-6 inline-flex w-fit items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <LineupCard
        lineup={lineup}
        showOwner={true}
        isOwner={false}
        currentUserId={session?.id ?? ""}
      />

      <LineupCommentsClient
        lineupId={lineupId}
        sessionUser={
          session
            ? {
                id: session.id ?? "",
                name: session.name ?? null,
                image: session.image ?? null,
              }
            : null
        }
      />
    </>
  );
}
