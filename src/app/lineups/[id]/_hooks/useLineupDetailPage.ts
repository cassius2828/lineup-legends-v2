import { useCallback, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { useSubmitComment } from "~/hooks/useSubmitComment";
import { useCommentModalStore } from "~/stores/commentModal";
import { useIsDesktop } from "~/hooks/useIsDesktop";
import {
  applyMobileComposerBlur,
  composerHasContent,
  handleComposerMetaEnter,
} from "~/app/_components/Comment/commentComposerUtils";
import type { ComposerMedia } from "~/app/_components/Comment/ComposerToolbar";

export function useLineupDetailPage() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [media, setMedia] = useState<ComposerMedia>({});
  const [mobileComposerExpanded, setMobileComposerExpanded] = useState(false);
  const composerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isDesktop = useIsDesktop();
  const openReply = useCommentModalStore((s) => s.openReply);

  const { data: session } = api.profile.getMe.useQuery(undefined, {
    retry: false,
  });

  const params = useParams();
  const rawId = params?.id;
  const lineupId =
    typeof rawId === "string"
      ? rawId
      : Array.isArray(rawId)
        ? (rawId[0] ?? "")
        : "";

  const { data: lineup, isLoading } = api.lineup.getLineupById.useQuery({
    id: lineupId,
  });

  const {
    data: commentData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = api.comment.getComments.useInfiniteQuery(
    { lineupId, limit: 10 },
    { getNextPageParam: (lastPage) => lastPage.cursor },
  );

  const { data: myVotes } = api.comment.getMyCommentVotes.useQuery(
    { lineupId },
    { enabled: !!lineupId && !!session },
  );

  const allComments = commentData?.pages.flatMap((p) => p.comments) ?? [];

  const { submit, isSubmitting } = useSubmitComment({
    lineupId,
    mode: "comment",
    commentId: undefined,
  });

  const hasContent = composerHasContent(text, media);
  const showComposerChrome = isDesktop || mobileComposerExpanded || hasContent;

  const submitComposer = () => {
    submit(text, media);
    setText("");
    setMedia({});
  };

  const handleComposerKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    handleComposerMetaEnter(e, {
      hasContent,
      isSubmitting,
      onSubmit: submitComposer,
    });
  };

  const sharedComposerFieldProps = {
    textareaRef,
    value: text,
    onChange: setText,
    onKeyDown: handleComposerKeyDown,
    media,
    onMediaChange: setMedia,
  };

  const handleComposerBlur = useCallback(
    (e: React.FocusEvent) =>
      applyMobileComposerBlur(e, {
        isDesktop,
        containerRef: composerRef,
        hasContent,
        onCollapse: () => setMobileComposerExpanded(false),
      }),
    [isDesktop, hasContent],
  );

  return {
    router,
    lineup,
    isLoading,
    lineupId,
    session,
    allComments,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    myVotes,
    openReply,
    isDesktop,
    text,
    hasContent,
    showComposerChrome,
    isSubmitting,
    submitComposer,
    sharedComposerFieldProps,
    composerRef,
    handleComposerBlur,
    setMobileComposerExpanded,
  };
}
