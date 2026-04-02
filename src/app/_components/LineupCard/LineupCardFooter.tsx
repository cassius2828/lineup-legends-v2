import { MessageCircle, Bookmark, Share2, Eye } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface LineupCardFooterProps {
    commentCount?: number;
    lineupId: string;
}

export default function LineupCardFooter({
    commentCount = 0,
    lineupId,
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
                    onClick={() => toast.info("Coming soon")}
                    className="group cursor-pointer text-foreground/40 transition-colors hover:text-gold"
                    aria-label="Share lineup"
                >
                    <Share2 className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}