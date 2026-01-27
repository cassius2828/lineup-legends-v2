import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";
import type { IUser } from "./user";
import type { ILineup } from "./lineup";

export interface IRating extends Document {
  _id: mongoose.Types.ObjectId;
  value: number; // 1-10
  userId: Types.ObjectId;
  user?: IUser;
  lineupId: Types.ObjectId;
  lineup?: ILineup;
  createdAt: Date;
  updatedAt: Date;
}

const RatingSchema = new Schema<IRating>(
  {
    value: { type: Number, required: true, min: 1, max: 10 },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    lineupId: { type: Schema.Types.ObjectId, ref: "Lineup", required: true },
  },
  {
    timestamps: true,
  }
);

// Compound unique index for one rating per user per lineup
RatingSchema.index({ userId: 1, lineupId: 1 }, { unique: true });

// Virtual for id
RatingSchema.virtual("id").get(function (this: IRating) {
  return this._id.toHexString();
});

// Virtual populations
RatingSchema.virtual("user", {
  ref: "User",
  localField: "userId",
  foreignField: "_id",
  justOne: true,
});

RatingSchema.virtual("lineup", {
  ref: "Lineup",
  localField: "lineupId",
  foreignField: "_id",
  justOne: true,
});

// Ensure virtuals are included in JSON output
RatingSchema.set("toJSON", { virtuals: true });
RatingSchema.set("toObject", { virtuals: true });

export const Rating: Model<IRating> =
  (mongoose.models.Rating as Model<IRating> | undefined) ?? mongoose.model<IRating>("Rating", RatingSchema);
