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

  const submit = (
    text: string,
    media?: { image?: string; gif?: string },
  ) => {
    const trimmed = text.trim();
    if (!trimmed && !media?.image && !media?.gif) return;

    if (mode === "comment") {
      addComment.mutate({
        lineupId,
        text: trimmed,
        image: media?.image,
        gif: media?.gif,
      });
    } else {
      if (!commentId) {
        toast.error("Cannot reply without a parent comment");
        return;
      }
      addReply.mutate({
        lineupId,
        commentId,
        text: trimmed,
        image: media?.image,
        gif: media?.gif,
      });
    }
  };

  const isSubmitting = addComment.isPending || addReply.isPending;

  return { submit, isSubmitting };
}
