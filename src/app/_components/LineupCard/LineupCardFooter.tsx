"use client";

import { useState } from "react";
import { MessageCircle, Bookmark, Share2, Eye } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import CommentModal from "~/app/_components/Comment/CommentModal";

interface LineupCardFooterProps {
  comments: Comment[];
  lineupId: string;
  ownerName: string;
  ownerImage?: string | null;
  totalValue: number;
}

export default function LineupCardFooter({
  comments,
  lineupId,
  ownerName,
  ownerImage,
  totalValue,
}: LineupCardFooterProps) {
  const [commentModalOpen, setCommentModalOpen] = useState(false);
console.log(comments.length, 'commentCount');

  return (
    <>
      <div className="mt-4 flex items-center justify-between border-t border-foreground/10 pt-3">
        {/* Comments */}
        <button
          type="button"
          onClick={() => setCommentModalOpen(prev => !prev)}
          className="group flex cursor-pointer items-center gap-1.5 text-foreground/40 transition-colors hover:text-gold"
        >
          <MessageCircle className="h-4 w-4" />
          {comments.length > 0 && (
            <span className="text-xs">{comments.length}</span>
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
          <button
            type="button"
            onClick={() => toast.info("Coming soon")}
            className="group cursor-pointer text-foreground/40 transition-colors hover:text-gold"
            aria-label="Bookmark lineup"
          >
            <Bookmark className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={async () => {
              const url = `${window.location.origin}/lineups/${lineupId}`;
              await navigator.clipboard.writeText(url);
              toast.success("Link copied to clipboard");
            }}
            className="group cursor-pointer text-foreground/40 transition-colors hover:text-gold"
            aria-label="Share lineup"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <CommentModal
        open={commentModalOpen}
        onClose={() => setCommentModalOpen(false)}
        lineupId={lineupId}
        mode="comment"
        lineup={{ lineupId, ownerName, ownerImage, totalValue }}
        comments={comments}
      />
    </>
  );
}