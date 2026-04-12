"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useCommentModalStore } from "~/stores/commentModal";
import CommentModal from "./CommentModal";

export default function GlobalCommentModal() {
  const {
    isOpen,
    mode,
    lineupId,
    lineup,
    parentComment,
    currentUserId,
    close,
  } = useCommentModalStore();

  const pathname = usePathname();
  useEffect(() => {
    if (isOpen) close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!isOpen) return null;

  if (mode === "comment" && lineup) {
    return (
      <CommentModal
        open={isOpen}
        onClose={close}
        lineupId={lineupId}
        mode="comment"
        lineup={lineup}
      />
    );
  }

  if (mode === "reply" && parentComment) {
    return (
      <CommentModal
        open={isOpen}
        onClose={close}
        lineupId={lineupId}
        currentUserId={currentUserId}
        mode="reply"
        parentComment={parentComment}
      />
    );
  }

  return null;
}
