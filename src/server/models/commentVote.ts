import mongoose, {
  Schema,
  type Document,
  type Model,
  type Types,
} from "mongoose";
import type { User } from "./user";
import type { Comment } from "./comment";

// API Type - for responses and client-side usage (after population)
export interface CommentVote {
  id: string;
  type: "upvote" | "downvote";
  user: User;
  comment: Comment;
  createdAt: Date;
}

// DB Type - for database operations
export interface CommentVoteDoc extends Document {
  type: "upvote" | "downvote";
  user: Types.ObjectId;
  comment: Types.ObjectId;
  createdAt: Date;
}

const CommentVoteSchema = new Schema<CommentVoteDoc>(
  {
    type: { type: String, enum: ["upvote", "downvote"], required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    comment: { type: Schema.Types.ObjectId, ref: "Comment", required: true },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
  },
);

// Compound unique index for one vote per user per comment
CommentVoteSchema.index({ user: 1, comment: 1 }, { unique: true });

// Virtual for id
CommentVoteSchema.virtual("id").get(function (this: CommentVoteDoc) {
  return this._id.toHexString();
});

// Ensure virtuals are included in JSON output
CommentVoteSchema.set("toJSON", { virtuals: true });
CommentVoteSchema.set("toObject", { virtuals: true });

export const CommentVoteModel: Model<CommentVoteDoc> =
  (mongoose.models.CommentVote as Model<CommentVoteDoc> | undefined) ??
  mongoose.model<CommentVoteDoc>("CommentVote", CommentVoteSchema);
