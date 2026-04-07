import mongoose, { Schema, type Document, type Model } from "mongoose";

// API Type - for responses and client-side usage
export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  imgUrl: string;
  value: number; // 1-5 representing player cost
}

// DB Type - for database operations
export interface PlayerDoc extends Document {
  firstName: string;
  lastName: string;
  imgUrl: string;
  value: number; // 1-5 representing player cost
}

const PlayerSchema = new Schema<PlayerDoc>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    imgUrl: { type: String, required: true },
    value: { type: Number, required: true, min: 1, max: 5 },
  },
  {
    timestamps: false,
  },
);

// Virtual for id (to match Prisma's id field)
PlayerSchema.virtual("id").get(function (this: PlayerDoc) {
  return this._id.toHexString();
});

// Ensure virtuals are included in JSON output
PlayerSchema.set("toJSON", { virtuals: true });
PlayerSchema.set("toObject", { virtuals: true });

// add index for text and value fields
PlayerSchema.index({ firstName: "text", lastName: "text", value: 1 });
export const PlayerModel: Model<PlayerDoc> =
  (mongoose.models.Player as Model<PlayerDoc> | undefined) ??
  mongoose.model<PlayerDoc>("Player", PlayerSchema);
