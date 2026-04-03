import { api } from "~/trpc/react";
import { toast } from "sonner";

interface UseSubmitCommentOptions {
  lineupId: string;
  mode: "comment" | "reply";
  commentId?: string;
  onSuccess?: () => void;
}

export function useSubmitComment({
  lineupId,
  mode,
  commentId,
  onSuccess,
}: UseSubmitCommentOptions) {
  const utils = api.useUtils();

  const addComment = api.comment.addComment.useMutation({
    onSuccess: () => {
      toast.success("Comment posted");
      void utils.comment.getComments.invalidate({ lineupId });
      onSuccess?.();
    },
    onError: (err) => toast.error(err.message),
  });

  const addReply = api.comment.addThreadReply.useMutation({
    onSuccess: () => {
      toast.success("Reply posted");
      if (commentId) {
        void utils.comment.getThreads.invalidate({ commentId });
      }
      void utils.comment.getComments.invalidate({ lineupId });
      void utils.comment.getCommentCount.invalidate({ lineupId });
      onSuccess?.();
    },
    onError: (err) => toast.error(err.message),
  });

  const submit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (mode === "comment") {
      addComment.mutate({ lineupId, text: trimmed });
    } else {
      if (!commentId) {
        toast.error("Cannot reply without a parent comment");
        return;
      }
      addReply.mutate({ lineupId, commentId, text: trimmed });
    }
  };

  const isSubmitting = addComment.isPending || addReply.isPending;

  return { submit, isSubmitting };
}
