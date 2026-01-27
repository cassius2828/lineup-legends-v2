import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";
import type { IUser } from "./user";
import type { ILineup } from "./lineup";

// Vote subdocument for comments
export interface ICommentVote {
  _id: mongoose.Types.ObjectId;
  userId: Types.ObjectId;
  upvote: boolean;
  downvote: boolean;
}

const CommentVoteSchema = new Schema<ICommentVote>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    upvote: { type: Boolean, default: false },
    downvote: { type: Boolean, default: false },
  },
  { _id: true }
);

// Thread subdocument (replies to comments)
export interface IThread {
  _id: mongoose.Types.ObjectId;
  text: string;
  userId: Types.ObjectId;
  user?: IUser;
  votes: ICommentVote[];
  totalVotes: number;
  createdAt: Date;
  updatedAt: Date;
}

const ThreadSchema = new Schema<IThread>(
  {
    text: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    votes: [CommentVoteSchema],
    totalVotes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Main Comment document
export interface IComment extends Document {
  _id: mongoose.Types.ObjectId;
  text: string;
  userId: Types.ObjectId;
  user?: IUser;
  lineupId: Types.ObjectId;
  lineup?: ILineup;
  votes: ICommentVote[];
  totalVotes: number;
  thread: IThread[];
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    text: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    lineupId: { type: Schema.Types.ObjectId, ref: "Lineup", required: true },
    votes: [CommentVoteSchema],
    totalVotes: { type: Number, default: 0 },
    thread: [ThreadSchema],
  },
  {
    timestamps: true,
  }
);

// Index for efficient lookups
CommentSchema.index({ lineupId: 1, createdAt: -1 });

// Virtual for id
CommentSchema.virtual("id").get(function (this: IComment) {
  return this._id.toHexString();
});

// Virtual populations
CommentSchema.virtual("user", {
  ref: "User",
  localField: "userId",
  foreignField: "_id",
  justOne: true,
});

CommentSchema.virtual("lineup", {
  ref: "Lineup",
  localField: "lineupId",
  foreignField: "_id",
  justOne: true,
});

// Ensure virtuals are included in JSON output
CommentSchema.set("toJSON", { virtuals: true });
CommentSchema.set("toObject", { virtuals: true });

export const Comment: Model<IComment> =
  (mongoose.models.Comment as Model<IComment> | undefined) ?? mongoose.model<IComment>("Comment", CommentSchema);
