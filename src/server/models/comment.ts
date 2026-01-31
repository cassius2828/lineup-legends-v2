import mongoose, {
  Schema,
  type Document,
  type Model,
  type Types,
} from "mongoose";
import type { User } from "./user";
import type { Lineup } from "./lineup";

// API Type - Thread subdocument for responses (after population)
export interface Thread {
  id: string;
  text: string;
  user: User;
  createdAt: Date;
  updatedAt: Date;
}

// DB Type - Thread subdocument for database
export interface ThreadDoc {
  text: string;
  user: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ThreadSchema = new Schema<ThreadDoc>(
  {
    text: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

// API Type - for responses and client-side usage (after population)
export interface Comment {
  id: string;
  text: string;
  user: User;
  lineup: Lineup;
  thread: Thread[];
  createdAt: Date;
  updatedAt: Date;
}

// DB Type - for database operations
export interface CommentDoc extends Document {
  text: string;
  user: Types.ObjectId;
  lineup: Types.ObjectId;
  thread: ThreadDoc[];
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<CommentDoc>(
  {
    text: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    lineup: { type: Schema.Types.ObjectId, ref: "Lineup", required: true },
    thread: [ThreadSchema],
  },
  {
    timestamps: true,
  },
);

// Index for efficient lookups
CommentSchema.index({ lineup: 1, createdAt: -1 });

// Virtual for id
CommentSchema.virtual("id").get(function (this: CommentDoc) {
  return this._id.toHexString();
});

// Ensure virtuals are included in JSON output
CommentSchema.set("toJSON", { virtuals: true });
CommentSchema.set("toObject", { virtuals: true });

export const CommentModel: Model<CommentDoc> =
  (mongoose.models.Comment as Model<CommentDoc> | undefined) ??
  mongoose.model<CommentDoc>("Comment", CommentSchema);
