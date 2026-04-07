import mongoose, { Schema } from "mongoose";

import type { Document, Model, Types } from "mongoose";
import type { User } from "./user";

// API Type - Thread subdocument for responses (after population)
export interface Thread {
  id: string;
  text?: string | null;
  user: User;
  comment: Comment;
  image: string | null;
  gif: string | null;
  totalVotes: number;
  createdAt: Date;
  updatedAt: Date;
}

// DB Type - Thread subdocument for database
export interface ThreadDoc extends Document {
  text?: string | null;
  user: Types.ObjectId;
  comment: Types.ObjectId;
  image: string | null;
  gif: string | null;
  totalVotes: number;
  createdAt: Date;
  updatedAt: Date;
}

const ThreadSchema = new Schema<ThreadDoc>(
  {
    text: { type: String, default: null },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    comment: { type: Schema.Types.ObjectId, ref: "Comment", required: true },
    image: { type: String, default: null },
    gif: { type: String, default: null },
    totalVotes: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// Virtual for id
ThreadSchema.virtual("id").get(function (this: ThreadDoc) {
  return this._id.toHexString();
});

// Index for efficient lookups
ThreadSchema.index({ user: 1, comment: 1, createdAt: -1 });
// Ensure virtuals are included in JSON output
ThreadSchema.set("toJSON", { virtuals: true });
ThreadSchema.set("toObject", { virtuals: true });

export const ThreadModel: Model<ThreadDoc> =
  (mongoose.models.Thread as Model<ThreadDoc> | undefined) ??
  mongoose.model<ThreadDoc>("Thread", ThreadSchema);
