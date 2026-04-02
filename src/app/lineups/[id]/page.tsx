"use client";

import { ArrowLeft } from "lucide-react";
import { LineupCard } from "~/app/_components/LineupCard/LineupCard";
import type { LineupType } from "~/lib/types";
import { api } from "~/trpc/react";
import { useParams, useRouter } from "next/navigation";
import Loading from "./loading";

const LineupCardPage = () => {
  const router = useRouter();
  const { data: session } = api.profile.getMe.useQuery(undefined, {
    retry: false,
  });
  const params = useParams();
  const rawId = params?.id;
  const lineupId =
    typeof rawId === "string" ? rawId : Array.isArray(rawId) ? (rawId[0] ?? "") : "";
  const { data: lineup, isLoading } = api.lineup.getLineupById.useQuery({
    id: lineupId,
  });
  if (isLoading) return <Loading />;
  if (!lineup) return <div className="p-12 text-center text-foreground/50">Lineup not found</div>;
  return (
    <div className="mx-auto my-12 flex w-full max-w-3xl flex-col px-4 pt-12">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-6 inline-flex w-fit items-center gap-1.5 text-sm text-foreground/40 transition-colors hover:text-foreground/70"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>
      <LineupCard
        lineup={lineup as unknown as LineupType}
        showOwner={true}
        isOwner={false}
        currentUserId={session?.id ?? ""}
      />
    </div>
  );
};

export default LineupCardPage