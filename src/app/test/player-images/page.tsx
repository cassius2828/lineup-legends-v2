"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { api } from "~/trpc/react";

interface BrokenImage {
  name: string;
  url: string;
  value: number;
}

interface PlayerData {
  _id: { toString(): string };
  firstName: string;
  lastName: string;
  imgUrl: string;
  value: number;
}

export default function PlayerImagesTestPage() {
  const { data: players, isLoading, refetch } = api.player.getAll.useQuery();

  const [isRunning, setIsRunning] = useState(false);
  const [runKey, setRunKey] = useState(0);
  const [brokenImages, setBrokenImages] = useState<BrokenImage[]>([]);
  const [loadedCount, setLoadedCount] = useState(0);
  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);

  const totalPlayers = players?.length ?? 0;
  const processedCount = loadedCount + brokenImages.length;
  const isComplete =
    isRunning && totalPlayers > 0 && processedCount === totalPlayers;

  const runTest = async () => {
    setBrokenImages([]);
    setLoadedCount(0);
    setProcessedIds(new Set());
    setReportGenerated(false);
    setRunKey((k) => k + 1);
    setIsRunning(true);
    await refetch();
  };

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
        toast.error("Failed to generate report");
      }
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Error generating report");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className="bg-surface-950 min-h-screen p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="text-foreground/60 hover:text-foreground/80 mb-4 inline-flex items-center gap-1 text-sm"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-foreground text-3xl font-bold">
            Player Images Test Page
          </h1>
          <p className="text-foreground/60 mt-2">
            Test all player images to find broken ones
          </p>
        </div>

        {/* Run Test Button */}
        <div className="mb-8 flex flex-wrap items-center gap-4">
          <button
            onClick={runTest}
            disabled={isLoading || (isRunning && !isComplete)}
            className="bg-gold hover:bg-gold-light rounded-lg px-6 py-3 font-semibold text-black transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading
              ? "Loading players..."
              : isRunning && !isComplete
                ? `Checking... (${processedCount}/${totalPlayers})`
                : isRunning
                  ? "Re-run Test"
                  : "Run Test"}
          </button>

          {isComplete && (
            <button
              onClick={generateReport}
              disabled={brokenImages.length === 0 || isGenerating}
              className="border-foreground/20 bg-foreground/10 text-foreground hover:bg-foreground/15 rounded-lg border px-6 py-3 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isGenerating
                ? "Generating..."
                : reportGenerated
                  ? "Report Generated!"
                  : `Generate Report (${brokenImages.length} broken)`}
            </button>
          )}
          {reportGenerated && (
            <p className="text-gold-300 text-sm">
              Saved to docs/broken-player-images.md
            </p>
          )}
        </div>

        {/* Stats */}
        {isRunning && (
          <div className="mb-8 flex flex-wrap gap-4">
            <div className="bg-foreground/10 rounded-lg px-6 py-4">
              <p className="text-foreground/60 text-sm">Total Players</p>
              <p className="text-foreground text-2xl font-bold">
                {totalPlayers}
              </p>
            </div>
            <div className="bg-foreground/10 rounded-lg px-6 py-4">
              <p className="text-foreground/60 text-sm">Processed</p>
              <p className="text-foreground text-2xl font-bold">
                {processedCount} / {totalPlayers}
              </p>
            </div>
            <div className="bg-gold-600/20 rounded-lg px-6 py-4">
              <p className="text-gold-300 text-sm">Loaded Successfully</p>
              <p className="text-gold-300 text-2xl font-bold">{loadedCount}</p>
            </div>
            <div className="rounded-lg bg-red-600/20 px-6 py-4">
              <p className="text-sm text-red-400">Broken Images</p>
              <p className="text-2xl font-bold text-red-400">
                {brokenImages.length}
              </p>
            </div>
          </div>
        )}

        {/* Idle state — show cached player grid without running checks */}
        {!isRunning && !isLoading && players && players.length > 0 && (
          <>
            <h2 className="text-foreground mb-4 text-xl font-semibold">
              All Players ({totalPlayers})
            </h2>
            <p className="text-foreground/40 mb-4 text-sm">
              Click &quot;Run Test&quot; to check for broken images
            </p>
            <div className="grid grid-cols-5 gap-4 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12">
              {players.map((player: PlayerData) => {
                const playerId = player._id.toString();
                return (
                  <Link
                    key={playerId}
                    href={`/admin/edit-player/${playerId}`}
                    className="relative aspect-square overflow-hidden rounded-lg bg-[#f2f2f2] transition-opacity hover:opacity-80"
                    title={`${player.firstName} ${player.lastName}`}
                  >
                    <img
                      src={player.imgUrl}
                      alt={`${player.firstName} ${player.lastName}`}
                      className="h-full w-full object-cover"
                    />
                  </Link>
                );
              })}
            </div>
          </>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex h-[40vh] items-center justify-center">
            <div className="text-center">
              <div className="border-t-gold border-foreground/20 mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4" />
              <p className="text-foreground/60">Loading players...</p>
            </div>
          </div>
        )}

        {/* Broken Images List */}
        {isRunning && brokenImages.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-red-400">
              Broken Images ({brokenImages.length})
            </h2>
            <div className="max-h-64 overflow-y-auto rounded-lg bg-red-900/20 p-4">
              <table className="text-foreground w-full text-sm">
                <thead>
                  <tr className="border-foreground/20 border-b">
                    <th className="pb-2 text-left">Player Name</th>
                    <th className="pb-2 text-left">Value</th>
                    <th className="pb-2 text-left">URL</th>
                  </tr>
                </thead>
                <tbody>
                  {brokenImages.map((img, idx) => (
                    <tr key={idx} className="border-foreground/10 border-b">
                      <td className="py-2">{img.name}</td>
                      <td className="py-2">${img.value}</td>
                      <td className="text-foreground/60 max-w-xs truncate py-2">
                        {img.url}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Image Grid (active test run) */}
        {isRunning && players && players.length > 0 && (
          <>
            <h2 className="text-foreground mb-4 text-xl font-semibold">
              All Players ({totalPlayers})
            </h2>
            <div
              key={runKey}
              className="grid grid-cols-5 gap-4 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12"
            >
              {players.map((player: PlayerData) => {
                const playerId = player._id.toString();
                const isBroken = brokenImages.some(
                  (b) => b.name === `${player.firstName} ${player.lastName}`,
                );

                return (
                  <Link
                    key={playerId}
                    href={`/admin/edit-player/${playerId}`}
                    className={`relative aspect-square overflow-hidden rounded-lg transition-opacity hover:opacity-80 ${
                      isBroken ? "ring-2 ring-red-500" : "bg-[#f2f2f2]"
                    }`}
                    title={`${player.firstName} ${player.lastName}`}
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
                        <span className="text-xs text-red-300">
                          {player.firstName} {player.lastName}
                        </span>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
