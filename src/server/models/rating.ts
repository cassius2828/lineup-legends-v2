import mongoose, {
  Schema,
  type Document,
  type Model,
  type Types,
} from "mongoose";
import type { User } from "./user";
import type { Lineup } from "./lineup";

// API Type - for responses and client-side usage (after population)
export interface Rating {
  id: string;
  value: number; // 1-10
  user: User;
  lineup: Lineup;
  createdAt: Date;
  updatedAt: Date;
}

// DB Type - for database operations
export interface RatingDoc extends Document {
  value: number; // 1-10
  user: Types.ObjectId;
  lineup: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const RatingSchema = new Schema<RatingDoc>(
  {
    value: { type: Number, required: true, min: 1, max: 10 },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    lineup: { type: Schema.Types.ObjectId, ref: "Lineup", required: true },
  },
  {
    timestamps: true,
  },
);

// Compound unique index for one rating per user per lineup
RatingSchema.index({ user: 1, lineup: 1 }, { unique: true });

// Virtual for id
RatingSchema.virtual("id").get(function (this: RatingDoc) {
  return this._id.toHexString();
});

// Ensure virtuals are included in JSON output
RatingSchema.set("toJSON", { virtuals: true });
RatingSchema.set("toObject", { virtuals: true });

export const RatingModel: Model<RatingDoc> =
  (mongoose.models.Rating as Model<RatingDoc> | undefined) ??
  mongoose.model<RatingDoc>("Rating", RatingSchema);
