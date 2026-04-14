import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { caller, HydrateClient } from "~/trpc/server";
import { auth } from "~/server/auth";
import { LineupCard } from "~/app/_components/LineupCard/LineupCard";
import { LineupCommentsClient } from "./_components/LineupCommentsClient";

type Props = { params: Promise<{ id: string }> };

export default async function LineupDetailPage({ params }: Props) {
  const { id } = await params;

  const [lineup, session] = await Promise.all([
    caller.lineup.getLineupById({ id }),
    auth(),
  ]);

  if (!lineup) notFound();

  return (
    <HydrateClient>
      <main className="from-surface-950 via-surface-800 to-surface-950 min-h-screen bg-gradient-to-b">
        <div className="mx-auto w-full max-w-3xl px-4 pt-8 md:my-12 md:pt-12">
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
            currentUserId={session?.user?.id ?? ""}
          />

          <LineupCommentsClient
            lineupId={id}
            sessionUser={
              session?.user
                ? {
                    id: session.user.id ?? "",
                    name: session.user.name ?? null,
                    image: session.user.image ?? null,
                  }
                : null
            }
          />
        </div>
      </main>
    </HydrateClient>
  );
}
