import mongoose, {
  Schema,
  type Document,
  type Model,
  type Types,
} from "mongoose";

// Vote subdocument for comments
export interface ICommentVote {
  id: mongoose.Types.ObjectId;
  user: Types.ObjectId;
  type: "upvote" | "downvote";
}

// Thread subdocument (replies to comments)
export interface IThread {
  _id: mongoose.Types.ObjectId;
  text: string;
  user: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ThreadSchema = new Schema<IThread>(
  {
    text: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

// Main Comment document
export interface IComment extends Document {
  _id: mongoose.Types.ObjectId;
  text: string;
  user: Types.ObjectId;
  lineup: Types.ObjectId;
  thread: IThread[];
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
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
CommentSchema.virtual("id").get(function (this: IComment) {
  return this._id.toHexString();
});

// Ensure virtuals are included in JSON output
CommentSchema.set("toJSON", { virtuals: true });
CommentSchema.set("toObject", { virtuals: true });

export const Comment: Model<IComment> =
  (mongoose.models.Comment as Model<IComment> | undefined) ??
  mongoose.model<IComment>("Comment", CommentSchema);
