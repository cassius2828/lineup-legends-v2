import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IPlayer extends Document {
  _id: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  imgUrl: string;
  value: number; // 1-5 representing player cost
}

const PlayerSchema = new Schema<IPlayer>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    imgUrl: { type: String, required: true },
    value: { type: Number, required: true, min: 1, max: 5 },
  },
  {
    timestamps: false,
  }
);

// Virtual for id (to match Prisma's id field)
PlayerSchema.virtual("id").get(function (this: IPlayer) {
  return this._id.toHexString();
});

// Ensure virtuals are included in JSON output
PlayerSchema.set("toJSON", { virtuals: true });
PlayerSchema.set("toObject", { virtuals: true });

export const Player: Model<IPlayer> =
  (mongoose.models.Player as Model<IPlayer> | undefined) ?? mongoose.model<IPlayer>("Player", PlayerSchema);
