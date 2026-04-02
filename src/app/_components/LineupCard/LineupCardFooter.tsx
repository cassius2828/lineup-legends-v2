import { MessageCircle, Bookmark, Share2 } from "lucide-react";

interface LineupCardFooterProps {
  commentCount?: number;
}

export default function LineupCardFooter({
  commentCount = 0,
}: LineupCardFooterProps) {
  return (
    <div className="mt-4 flex items-center justify-between border-t border-foreground/10 pt-3">
      {/* Comments */}
      <button
        type="button"
        className="group flex cursor-pointer items-center gap-1.5 text-foreground/40 transition-colors hover:text-gold"
      >
        <MessageCircle className="h-4 w-4" />
        {commentCount > 0 && (
          <span className="text-xs">{commentCount}</span>
        )}
      </button>

      {/* Bookmark + Share */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="group cursor-pointer text-foreground/40 transition-colors hover:text-gold"
          aria-label="Bookmark lineup"
        >
          <Bookmark className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="group cursor-pointer text-foreground/40 transition-colors hover:text-gold"
          aria-label="Share lineup"
        >
          <Share2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}