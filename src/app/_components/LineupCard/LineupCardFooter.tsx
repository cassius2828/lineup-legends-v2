"use client";

import { useState } from "react";
import { MessageCircle, Bookmark, BookmarkCheck, Eye } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import ShareMenu from "~/app/_components/LineupCard/ShareMenu";
import { useCommentModalStore } from "~/stores/commentModal";
import { api } from "~/trpc/react";

interface LineupCardFooterProps {
  commentCount: number;
  lineupId: string;
  ownerName: string;
  ownerImage?: string | null;
  totalValue: number;
}

export default function LineupCardFooter({
  commentCount,
  lineupId,
  ownerName,
  ownerImage,
  totalValue,
}: LineupCardFooterProps) {
  const { data: session } = useSession();
  const openComment = useCommentModalStore((s) => s.openComment);
  const isAuthenticated = !!session?.user;

  const { data: bookmarkData } = api.bookmark.isBookmarked.useQuery(
    { lineupId },
    { enabled: isAuthenticated && !!lineupId },
  );

  const [optimisticBookmarked, setOptimisticBookmarked] = useState<boolean | null>(null);
  const bookmarked = optimisticBookmarked ?? bookmarkData?.bookmarked ?? false;

  const utils = api.useUtils();
  const toggleBookmark = api.bookmark.toggle.useMutation({
    onSuccess: (data) => {
      setOptimisticBookmarked(data.bookmarked);
      void utils.bookmark.isBookmarked.invalidate({ lineupId });
      void utils.bookmark.getBookmarkedLineups.invalidate();
    },
    onError: () => {
      setOptimisticBookmarked(bookmarkData?.bookmarked ?? false);
      toast.error("Failed to update bookmark");
    },
  });

  const handleBookmark = () => {
    if (!isAuthenticated) {
      toast.info("Sign in to bookmark lineups");
      return;
    }
    setOptimisticBookmarked(!bookmarked);
    toggleBookmark.mutate({ lineupId });
  };

  const BookmarkIcon = bookmarked ? BookmarkCheck : Bookmark;

  return (
      <div className="mt-4 flex items-center justify-between border-t border-foreground/10 pt-3">
        {/* Comments */}
        <button
          type="button"
          onClick={() => {
            if (!isAuthenticated) {
              toast.info("Sign in to comment");
              return;
            }
            openComment(lineupId, { lineupId, ownerName, ownerImage, totalValue });
          }}
          className="group flex cursor-pointer items-center gap-1.5 text-foreground/40 transition-colors hover:text-gold"
        >
          <MessageCircle className="h-4 w-4" />
          {commentCount > 0 && (
            <span className="text-xs">{commentCount}</span>
          )}
        </button>

        {/* View + Bookmark + Share */}
        <div className="flex items-center gap-3">
          <Link
            href={`/lineups/${lineupId}`}
            className="text-foreground/40 transition-colors hover:text-gold"
            aria-label="View lineup"
          >
            <Eye className="h-4 w-4" />
          </Link>
          {isAuthenticated && (
            <button
              type="button"
              onClick={handleBookmark}
              className={`group cursor-pointer transition-colors ${
                bookmarked
                  ? "text-gold hover:text-gold-light"
                  : "text-foreground/40 hover:text-gold"
              }`}
              aria-label={bookmarked ? "Remove bookmark" : "Bookmark lineup"}
              aria-pressed={bookmarked}
            >
              <BookmarkIcon className="h-4 w-4" />
            </button>
          )}
          <ShareMenu lineupId={lineupId} />
        </div>
      </div>
  );
}
