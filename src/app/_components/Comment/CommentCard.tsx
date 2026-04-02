import Image from "next/image";
import React from "react";
import type { Comment } from "~/server/models";

const CommentCard = ({ comment }: { comment: Comment }) => {
    console.log(comment, 'comment');
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
    </div>
  );
};

export default CommentCard;
