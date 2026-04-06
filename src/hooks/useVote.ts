import { useState, useCallback } from "react";

type VoteType = "upvote" | "downvote";

interface UseVoteOptions {
  initialVote: VoteType | null;
  initialTotal: number;
  isOwn: boolean;
  currentUserId: string | undefined;
  onVote: (type: VoteType) => void;
  onReset?: (vote: VoteType | null, total: number) => void;
}

export function useVote({
  initialVote,
  initialTotal,
  isOwn,
  currentUserId,
  onVote,
}: UseVoteOptions) {
  const [optimisticVote, setOptimisticVote] = useState(initialVote);
  const [optimisticTotal, setOptimisticTotal] = useState(initialTotal);

  const handleVote = useCallback(
    (type: VoteType) => {
      if (isOwn || !currentUserId) return;

      const newVote = optimisticVote === type ? null : type;
      const delta =
        optimisticVote === null
          ? type === "upvote"
            ? 1
            : -1
          : optimisticVote === type
            ? type === "upvote"
              ? -1
              : 1
            : type === "upvote"
              ? 2
              : -2;

      setOptimisticVote(newVote);
      setOptimisticTotal((prev) => prev + delta);
      onVote(type);
    },
    [isOwn, currentUserId, optimisticVote, onVote],
  );

  const resetVote = useCallback(
    (vote: VoteType | null, total: number) => {
      setOptimisticVote(vote);
      setOptimisticTotal(total);
    },
    [],
  );

  const voteColor =
    optimisticTotal > 0
      ? "text-gold"
      : optimisticTotal < 0
        ? "text-red-500"
        : "text-foreground/40";

  return {
    optimisticVote,
    optimisticTotal,
    voteColor,
    handleVote,
    resetVote,
    isDisabled: isOwn || !currentUserId,
  };
}
