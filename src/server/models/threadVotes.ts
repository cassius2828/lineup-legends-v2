import mongoose, {
  Schema,
  type Document,
  type Model,
  type Types,
} from "mongoose";
import type { Thread } from "./threads";
import type { User } from "./user";

export interface ThreadVote {
  id: string;
  type: "upvote" | "downvote";
  user: User;
  thread: Thread;
  createdAt: Date;
}

export interface ThreadVoteDoc extends Document {
  type: "upvote" | "downvote";
  user: Types.ObjectId;
  thread: Types.ObjectId;
  createdAt: Date;
}

const ThreadVoteSchema = new Schema<ThreadVoteDoc>(
  {
    type: { type: String, enum: ["upvote", "downvote"], required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    thread: { type: Schema.Types.ObjectId, ref: "Thread", required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

// Virtual for id
ThreadVoteSchema.virtual("id").get(function (this: ThreadVoteDoc) {
  return this._id.toHexString();
});

// Compound unique index for one vote per user per thread
ThreadVoteSchema.index({ user: 1, thread: 1 }, { unique: true });

// Ensure virtuals are included in JSON output
ThreadVoteSchema.set("toJSON", { virtuals: true });
ThreadVoteSchema.set("toObject", { virtuals: true });

export const ThreadVoteModel: Model<ThreadVoteDoc> =
  (mongoose.models.ThreadVote as Model<ThreadVoteDoc> | undefined) ??
  mongoose.model<ThreadVoteDoc>("ThreadVote", ThreadVoteSchema);
