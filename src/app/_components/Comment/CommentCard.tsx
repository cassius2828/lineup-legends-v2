import { MessageCircle } from "lucide-react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import type { Comment } from "~/server/models";

export default function CommentCard({ comment }: { comment: Comment }) {
  const displayName = comment.user.name ?? comment.user.username ?? "Anonymous";
  const avatar = comment.user.image ?? comment.user.profileImg;
  const relativeTime = formatDistanceToNow(new Date(comment.createdAt), {
    addSuffix: true,
  });

  return (
    <div className="flex gap-3 border-b border-foreground/10 py-4 last:border-b-0">
      {/* Avatar */}
      {avatar ? (
        <Image
          src={avatar}
          alt={displayName}
          width={36}
          height={36}
          className="h-9 w-9 shrink-0 rounded-full"
        />
      ) : (
        <div className="h-9 w-9 shrink-0 rounded-full bg-foreground/10" />
      )}

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Name + time */}
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium text-foreground">
            {displayName}
          </span>
          <span className="text-foreground/30">·</span>
          <span className="shrink-0 text-xs text-foreground/40">
            {relativeTime}
          </span>
        </div>

        {/* Body */}
        <p className="mt-1 text-sm leading-relaxed text-foreground/80">
          {comment.text}
        </p>

        {/* Actions */}
        <div className="mt-2 flex items-center gap-6">
          <button
            type="button"
            className="flex cursor-pointer items-center gap-1.5 text-foreground/30 transition-colors hover:text-gold"
          >
            <MessageCircle className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
