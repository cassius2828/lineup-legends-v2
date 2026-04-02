"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { api } from "~/trpc/react";
import { PlayerImage } from "~/app/_components/PlayerImage";

const VALUE_TIERS: Record<number, { label: string; color: string; glow: string }> = {
    5: { label: "Diamond", color: "text-cyan-300", glow: "shadow-[0px_0px_20px_6px_#99fcff]" },
    4: { label: "Amethyst", color: "text-purple-400", glow: "shadow-[0px_0px_20px_6px_#8317e8]" },
    3: { label: "Gold", color: "text-yellow-400", glow: "shadow-[0px_0px_20px_6px_#e3b920]" },
    2: { label: "Silver", color: "text-gray-300", glow: "shadow-[0px_0px_20px_6px_#c0c0c0]" },
    1: { label: "Bronze", color: "text-amber-600", glow: "shadow-[0px_0px_20px_6px_#804a14]" },
};

export default function PlayerPage() {
    const params = useParams();
    const playerId = params?.id as string;
    const router = useRouter();
    const { data: player, isLoading } = api.player.getById.useQuery(
        { id: playerId },
        { enabled: !!playerId },
    );

    if (isLoading) {
        return (
            <main className="flex min-h-[60vh] items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-foreground/10 border-t-gold" />
            </main>
        );
    }

    if (!player) {
        return (
            <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
                <p className="text-lg text-foreground/50">Player not found</p>
                <Link href="/" className="text-sm text-gold transition-colors hover:text-gold-light">
                    Go home
                </Link>
            </main>
        );
    }

    const tier = VALUE_TIERS[player.value] ?? VALUE_TIERS[1]!;

    return (
        <main className="mx-auto max-w-2xl px-4 py-12">
            <button
                onClick={() => router.back()}
                className="mb-8 inline-flex items-center gap-1.5 text-sm text-foreground/40 transition-colors hover:text-foreground/70"
            >
                <ArrowLeft className="h-4 w-4" />
                Back
            </button>

            <div className="flex flex-col items-center gap-8">
                {/* Headshot */}
                <div
                    className={`relative h-48 w-48 overflow-hidden rounded-full bg-[#f2f2f2] sm:h-64 sm:w-64 ${tier.glow}`}
                >
                    <PlayerImage
                        imgUrl={player.imgUrl}
                        alt={`${player.firstName} ${player.lastName}`}
                        className="absolute inset-0 h-full w-full rounded-full object-cover"
                    />
                </div>

                {/* Name + Tier */}
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                        {player.firstName} {player.lastName}
                    </h1>
                    <p className={`mt-2 text-lg font-semibold ${tier.color}`}>
                        {tier.label}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-foreground">${player.value}</p>
                </div>

                {/* Player info card */}
                <div className="w-full rounded-xl border border-foreground/10 bg-surface-800/50 p-6">
                    <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-foreground/40">
                        Player Info
                    </h2>
                    <dl className="grid grid-cols-2 gap-4 text-sm text-foreground/90">
                        <span>more info coming soon</span>
                    </dl>
                </div>
            </div>
        </main>
    );
}
