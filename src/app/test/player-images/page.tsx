"use client";

import { useState, useCallback } from "react";
import { api } from "~/trpc/react";

interface BrokenImage {
  name: string;
  url: string;
  value: number;
}

// Type for player from the API response
interface PlayerData {
  _id: { toString(): string };
  firstName: string;
  lastName: string;
  imgUrl: string;
  value: number;
}

export default function PlayerImagesTestPage() {
  const { data: players, isLoading } = api.player.getAll.useQuery();

  const [brokenImages, setBrokenImages] = useState<BrokenImage[]>([]);
  const [loadedCount, setLoadedCount] = useState(0);
  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);

  const totalPlayers = players?.length ?? 0;
  const processedCount = loadedCount + brokenImages.length;

  const handleImageError = useCallback(
    (player: PlayerData) => {
      const playerId = player._id.toString();
      if (processedIds.has(playerId)) return;

      setProcessedIds((prev) => new Set(prev).add(playerId));
      setBrokenImages((prev) => [
        ...prev,
        {
          name: `${player.firstName} ${player.lastName}`,
          url: player.imgUrl,
          value: player.value,
        },
      ]);
    },
    [processedIds],
  );

  const handleImageLoad = useCallback(
    (player: PlayerData) => {
      const playerId = player._id.toString();
      if (processedIds.has(playerId)) return;

      setProcessedIds((prev) => new Set(prev).add(playerId));
      setLoadedCount((prev) => prev + 1);
    },
    [processedIds],
  );

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/test/broken-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brokenImages }),
      });

      if (response.ok) {
        setReportGenerated(true);
      } else {
        alert("Failed to generate report");
      }
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Error generating report");
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface-950">
        <div className="text-center">
          <div className="border-t-gold mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-foreground/20" />
          <p className="text-foreground/60">Loading players...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface-950 p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Player Images Test Page
          </h1>
          <p className="mt-2 text-foreground/60">
            Testing all player images from the database
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8 flex flex-wrap gap-4">
          <div className="rounded-lg bg-foreground/10 px-6 py-4">
            <p className="text-sm text-foreground/60">Total Players</p>
            <p className="text-2xl font-bold text-foreground">{totalPlayers}</p>
          </div>
          <div className="rounded-lg bg-foreground/10 px-6 py-4">
            <p className="text-sm text-foreground/60">Processed</p>
            <p className="text-2xl font-bold text-foreground">
              {processedCount} / {totalPlayers}
            </p>
          </div>
          <div className="rounded-lg bg-gold-600/20 px-6 py-4">
            <p className="text-sm text-gold-300">Loaded Successfully</p>
            <p className="text-2xl font-bold text-gold-300">{loadedCount}</p>
          </div>
          <div className="rounded-lg bg-red-600/20 px-6 py-4">
            <p className="text-sm text-red-400">Broken Images</p>
            <p className="text-2xl font-bold text-red-400">
              {brokenImages.length}
            </p>
          </div>
        </div>

        {/* Generate Report Button */}
        <div className="mb-8">
          <button
            onClick={generateReport}
            disabled={brokenImages.length === 0 || isGenerating}
            className="bg-gold hover:bg-gold-light rounded-lg px-6 py-3 font-semibold text-black transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isGenerating
              ? "Generating..."
              : reportGenerated
                ? "Report Generated!"
                : `Generate Report (${brokenImages.length} broken)`}
          </button>
          {reportGenerated && (
            <p className="mt-2 text-sm text-gold-300">
              Report saved to docs/broken-player-images.md
            </p>
          )}
        </div>

        {/* Broken Images List */}
        {brokenImages.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-red-400">
              Broken Images ({brokenImages.length})
            </h2>
            <div className="max-h-64 overflow-y-auto rounded-lg bg-red-900/20 p-4">
              <table className="w-full text-sm text-foreground">
                <thead>
                  <tr className="border-b border-foreground/20">
                    <th className="pb-2 text-left">Player Name</th>
                    <th className="pb-2 text-left">Value</th>
                    <th className="pb-2 text-left">URL</th>
                  </tr>
                </thead>
                <tbody>
                  {brokenImages.map((img, idx) => (
                    <tr key={idx} className="border-b border-foreground/10">
                      <td className="py-2">{img.name}</td>
                      <td className="py-2">${img.value}</td>
                      <td className="max-w-xs truncate py-2 text-foreground/60">
                        {img.url}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Image Grid */}
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          All Players ({totalPlayers})
        </h2>
        <div className="grid grid-cols-5 gap-4 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12">
          {players?.map((player) => {
            const playerId = player._id.toString();
            const isBroken = brokenImages.some(
              (b) => b.name === `${player.firstName} ${player.lastName}`,
            );

            return (
              <div
                key={playerId}
                className={`relative aspect-square overflow-hidden rounded-lg ${
                  isBroken ? "ring-2 ring-red-500" : "bg-[#f2f2f2]"
                }`}
              >
                <img
                  src={player.imgUrl}
                  alt={`${player.firstName} ${player.lastName}`}
                  className="h-full w-full object-cover"
                  onError={() => handleImageError(player)}
                  onLoad={() => handleImageLoad(player)}
                />
                {isBroken && (
                  <div className="absolute inset-0 flex items-center justify-center bg-red-900/80">
                    <span className="text-xs text-red-300">X</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
