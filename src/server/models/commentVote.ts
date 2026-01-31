import mongoose, {
  Schema,
  type Document,
  type Model,
  type Types,
} from "mongoose";

export interface ICommentVote extends Document {
  _id: mongoose.Types.ObjectId;
  type: "upvote" | "downvote";
  user: Types.ObjectId;
  comment: Types.ObjectId;
  createdAt: Date;
}

const CommentVoteSchema = new Schema<ICommentVote>(
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
CommentVoteSchema.virtual("id").get(function (this: ICommentVote) {
  return this._id.toHexString();
});



// Ensure virtuals are included in JSON output
CommentVoteSchema.set("toJSON", { virtuals: true });
CommentVoteSchema.set("toObject", { virtuals: true });

export const CommentVote: Model<ICommentVote> =
  (mongoose.models.CommentVote as Model<ICommentVote> | undefined) ??
  mongoose.model<ICommentVote>("CommentVote", CommentVoteSchema);
