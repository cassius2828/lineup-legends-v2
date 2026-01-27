import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";
import type { IUser } from "./user";
import type { ILineup } from "./lineup";

export interface IVote extends Document {
  _id: mongoose.Types.ObjectId;
  type: "upvote" | "downvote";
  userId: Types.ObjectId;
  user?: IUser;
  lineupId: Types.ObjectId;
  lineup?: ILineup;
  createdAt: Date;
}

const VoteSchema = new Schema<IVote>(
  {
    type: { type: String, enum: ["upvote", "downvote"], required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    lineupId: { type: Schema.Types.ObjectId, ref: "Lineup", required: true },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
  }
);

// Compound unique index for one vote per user per lineup
VoteSchema.index({ userId: 1, lineupId: 1 }, { unique: true });

// Virtual for id
VoteSchema.virtual("id").get(function (this: IVote) {
  return this._id.toHexString();
});

// Virtual populations
VoteSchema.virtual("user", {
  ref: "User",
  localField: "userId",
  foreignField: "_id",
  justOne: true,
});

VoteSchema.virtual("lineup", {
  ref: "Lineup",
  localField: "lineupId",
  foreignField: "_id",
  justOne: true,
});

// Ensure virtuals are included in JSON output
VoteSchema.set("toJSON", { virtuals: true });
VoteSchema.set("toObject", { virtuals: true });

export const Vote: Model<IVote> =
  (mongoose.models.Vote as Model<IVote> | undefined) ?? mongoose.model<IVote>("Vote", VoteSchema);
