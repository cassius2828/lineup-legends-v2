"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import type { PlayerOutput } from "~/server/api/schemas/output";

/**
 * Orchestrates the two-stage wiki data fetch (summary + AI awards fallback)
 * for a given player. Shared between the player detail page and the
 * lineup-builder side panel.
 */
export function useEnsureWikiData({
  playerId,
  player,
  enabled = true,
}: {
  playerId: string | undefined;
  player: PlayerOutput | null | undefined;
  /** Gate for contexts where fetching should only happen when visible (e.g. panel open). */
  enabled?: boolean;
}) {
  const utils = api.useUtils();
  const wikiAttempted = useRef(false);
  const aiAwardsAttempted = useRef(false);

  const ensureWiki = api.player.ensureWikiSummary.useMutation({
    onSuccess: async (data) => {
      if (!playerId) return;
      utils.player.getById.setData({ id: playerId }, data);
      await utils.player.getById.invalidate({ id: playerId });
    },
    onError: (err) => {
      wikiAttempted.current = false;
      toast.error(err.message);
    },
  });
  const { reset: resetWikiMutation, mutate: mutateWiki } = ensureWiki;

  const ensureAwardsAI = api.player.ensureAwardsAI.useMutation({
    onSuccess: async (data) => {
      if (!playerId) return;
      utils.player.getById.setData({ id: playerId }, data);
      await utils.player.getById.invalidate({ id: playerId });
    },
  });

  useEffect(() => {
    wikiAttempted.current = false;
    aiAwardsAttempted.current = false;
    resetWikiMutation();
  }, [playerId, enabled, resetWikiMutation]);

  useEffect(() => {
    if (!enabled || !playerId || !player) return;
    const wikiReady =
      !!player.wikiSummaryExtract?.trim() &&
      player.wikiAwardsHonorsText !== undefined;
    if (wikiReady) return;
    if (wikiAttempted.current) return;
    wikiAttempted.current = true;
    mutateWiki({ id: playerId });
  }, [enabled, playerId, player, mutateWiki]);

  useEffect(() => {
    if (!enabled || !playerId || !player) return;
    if (!player.wikiSummaryExtract?.trim()) return;
    if (player.wikiAwardsHonorsText?.trim()) return;
    if (aiAwardsAttempted.current) return;
    if (ensureWiki.isPending) return;
    aiAwardsAttempted.current = true;
    ensureAwardsAI.mutate({ id: playerId });
  }, [enabled, playerId, player, ensureWiki.isPending, ensureAwardsAI]);

  return { ensureWiki, ensureAwardsAI, wikiAttempted, mutateWiki };
}
