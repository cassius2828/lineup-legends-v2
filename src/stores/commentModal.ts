import { create } from "zustand";
import type { ParentComment } from "~/app/_components/Comment/CommentModal";

interface LineupContext {
  lineupId: string;
  ownerName: string;
  ownerImage?: string | null;
  totalValue: number;
}

interface CommentModalState {
  isOpen: boolean;
  mode: "comment" | "reply";
  lineupId: string;
  lineup: LineupContext | null;
  parentComment: ParentComment | null;
  currentUserId: string | undefined;

  openComment: (lineupId: string, lineup: LineupContext) => void;
  openReply: (
    lineupId: string,
    parentComment: ParentComment,
    currentUserId?: string,
  ) => void;
  close: () => void;
}

export const useCommentModalStore = create<CommentModalState>((set) => ({
  isOpen: false,
  mode: "comment",
  lineupId: "",
  lineup: null,
  parentComment: null,
  currentUserId: undefined,

  openComment: (lineupId, lineup) =>
    set({
      isOpen: true,
      mode: "comment",
      lineupId,
      lineup,
      parentComment: null,
      currentUserId: undefined,
    }),

  openReply: (lineupId, parentComment, currentUserId) =>
    set({
      isOpen: true,
      mode: "reply",
      lineupId,
      parentComment,
      currentUserId,
      lineup: null,
    }),

  close: () =>
    set({
      isOpen: false,
      lineupId: "",
      lineup: null,
      parentComment: null,
      currentUserId: undefined,
    }),
}));
