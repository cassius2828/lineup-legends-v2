import mongoose, {
  Schema,
  type Document,
  type Model,
  type Types,
} from "mongoose";

export interface ILineup extends Document {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  featured: boolean;
  players: {
    pg: Types.ObjectId;
    sg: Types.ObjectId;
    sf: Types.ObjectId;
    pf: Types.ObjectId;
    c: Types.ObjectId;
  };
  owner: Types.ObjectId;
  totalVotes: number;
  avgRating: number;
  timesGambled: number;
}

const LineupSchema = new Schema<ILineup>(
  {
    featured: { type: Boolean, default: false },
    players: {
      pg: { type: Schema.Types.ObjectId, ref: "Player", required: true },
      sg: { type: Schema.Types.ObjectId, ref: "Player", required: true },
      sf: { type: Schema.Types.ObjectId, ref: "Player", required: true },
      pf: { type: Schema.Types.ObjectId, ref: "Player", required: true },
      c: { type: Schema.Types.ObjectId, ref: "Player", required: true },
    },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    totalVotes: { type: Number, default: 0 },
    avgRating: { type: Number, default: 0 },
    timesGambled: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  },
);

// Virtual for id
LineupSchema.virtual("id").get(function (this: ILineup) {
  return this._id.toHexString();
});

// Virtual populations for positions
LineupSchema.virtual("pg", {
  ref: "Player",
  localField: "players.pg",
  foreignField: "_id",
  justOne: true,
});

LineupSchema.virtual("sg", {
  ref: "Player",
  localField: "players.sg",
  foreignField: "_id",
  justOne: true,
});

LineupSchema.virtual("sf", {
  ref: "Player",
  localField: "players.sf",
  foreignField: "_id",
  justOne: true,
});

LineupSchema.virtual("pf", {
  ref: "Player",
  localField: "players.pf",
  foreignField: "_id",
  justOne: true,
});

LineupSchema.virtual("c", {
  ref: "Player",
  localField: "players.c",
  foreignField: "_id",
  justOne: true,
});

LineupSchema.virtual("owner", {
  ref: "User",
  localField: "owner",
  foreignField: "_id",
  justOne: true,
});

// Ensure virtuals are included in JSON output
LineupSchema.set("toJSON", { virtuals: true });
LineupSchema.set("toObject", { virtuals: true });

// add index on owner, avgRating, totalVotes
LineupSchema.index({ owner: 1, avgRating: 1, totalVotes: 1 });

export const Lineup: Model<ILineup> =
  (mongoose.models.Lineup as Model<ILineup> | undefined) ??
  mongoose.model<ILineup>("Lineup", LineupSchema);
