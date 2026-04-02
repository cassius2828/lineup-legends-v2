import { MessageCircle } from "lucide-react";
import Image from "next/image";
import React from "react";
import type { Comment } from "~/server/models";

const CommentCard = ({ comment }: { comment: Comment }) => {
  return (
    <div>
      <ul>
        <li>
          <Image
            src={comment.user.image ?? ""}
            alt={comment.user.name ?? ""}
            width={32}
            height={32}
          />
          {comment.user.name}
        </li>
        <li>{comment.text}</li> <li>{comment.createdAt.toLocaleString()}</li>
        {/*
        <li>{comment.totalVotes}</li>
        <li>{comment.image}</li>
        <li>{comment.gif}</li>
        <li>{comment.lineup.name}</li>
        <li>{comment.lineup.owner.name}</li>
        <li>{comment.lineup.owner.image}</li>
        <li>{comment.lineup.owner.profileImg}</li> */}
      </ul>
      <footer>
              <button
                  type="button"
                  onClick={() => null}
                  className="group flex cursor-pointer items-center gap-1.5 text-foreground/40 transition-colors hover:text-gold"
              >
                  <MessageCircle className="h-4 w-4" />
                  {/* {threads.length > 0 && (
                      <span className="text-xs">{comments.length}</span>
                  )} */}
              </button>
      </footer>
    </div>
  );
};

export default CommentCard;
