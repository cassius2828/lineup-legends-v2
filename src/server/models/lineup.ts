import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";
import type { IPlayer } from "./player";
import type { IUser } from "./user";

export interface ILineup extends Document {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  featured: boolean;
  pgId: Types.ObjectId;
  pg?: IPlayer;
  sgId: Types.ObjectId;
  sg?: IPlayer;
  sfId: Types.ObjectId;
  sf?: IPlayer;
  pfId: Types.ObjectId;
  pf?: IPlayer;
  cId: Types.ObjectId;
  c?: IPlayer;
  ownerId: Types.ObjectId;
  owner?: IUser;
  totalVotes: number;
  avgRating: number;
  timesGambled: number;
}

const LineupSchema = new Schema<ILineup>(
  {
    featured: { type: Boolean, default: false },
    pgId: { type: Schema.Types.ObjectId, ref: "Player", required: true },
    sgId: { type: Schema.Types.ObjectId, ref: "Player", required: true },
    sfId: { type: Schema.Types.ObjectId, ref: "Player", required: true },
    pfId: { type: Schema.Types.ObjectId, ref: "Player", required: true },
    cId: { type: Schema.Types.ObjectId, ref: "Player", required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    totalVotes: { type: Number, default: 0 },
    avgRating: { type: Number, default: 0 },
    timesGambled: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Virtual for id
LineupSchema.virtual("id").get(function (this: ILineup) {
  return this._id.toHexString();
});

// Virtual populations for positions
LineupSchema.virtual("pg", {
  ref: "Player",
  localField: "pgId",
  foreignField: "_id",
  justOne: true,
});

LineupSchema.virtual("sg", {
  ref: "Player",
  localField: "sgId",
  foreignField: "_id",
  justOne: true,
});

LineupSchema.virtual("sf", {
  ref: "Player",
  localField: "sfId",
  foreignField: "_id",
  justOne: true,
});

LineupSchema.virtual("pf", {
  ref: "Player",
  localField: "pfId",
  foreignField: "_id",
  justOne: true,
});

LineupSchema.virtual("c", {
  ref: "Player",
  localField: "cId",
  foreignField: "_id",
  justOne: true,
});

LineupSchema.virtual("owner", {
  ref: "User",
  localField: "ownerId",
  foreignField: "_id",
  justOne: true,
});

// Ensure virtuals are included in JSON output
LineupSchema.set("toJSON", { virtuals: true });
LineupSchema.set("toObject", { virtuals: true });

// add index on owner, avgRating, totalVotes
LineupSchema.index({ ownerId: 1, avgRating: 1, totalVotes: 1 })

export const Lineup: Model<ILineup> =
  (mongoose.models.Lineup as Model<ILineup> | undefined) ?? mongoose.model<ILineup>("Lineup", LineupSchema);
