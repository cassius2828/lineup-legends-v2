import mongoose, {
  Schema,
  type Document,
  type Model,
  type Types,
} from "mongoose";
import type { Player } from "./player";
import type { User } from "./user";

// API Type - Players subdocument for responses (after population)
export interface LineupPlayers {
  pg: Player;
  sg: Player;
  sf: Player;
  pf: Player;
  c: Player;
}

// DB Type - Players subdocument for database
export interface LineupPlayersDoc {
  pg: Types.ObjectId;
  sg: Types.ObjectId;
  sf: Types.ObjectId;
  pf: Types.ObjectId;
  c: Types.ObjectId;
}

// API Type - for responses and client-side usage (after population)
export interface Lineup {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  featured: boolean;
  players: LineupPlayers;
  owner: User;
  totalVotes: number;
  avgRating: number;
  timesGambled: number;
}

// DB Type - for database operations
export interface LineupDoc extends Document {
  createdAt: Date;
  updatedAt: Date;
  featured: boolean;
  players: LineupPlayersDoc;
  owner: Types.ObjectId;
  totalVotes: number;
  avgRating: number;
  ratingCount: number;
  ratingSum: number;
  timesGambled: number;
}

const LineupSchema = new Schema<LineupDoc>(
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
LineupSchema.virtual("id").get(function (this: LineupDoc) {
  return this._id.toHexString();
});

// Ensure virtuals are included in JSON output
LineupSchema.set("toJSON", { virtuals: true });
LineupSchema.set("toObject", { virtuals: true });

// add index on owner, avgRating, totalVotes
LineupSchema.index({ owner: 1, createdAt: -1 }); // lineups created by a user
LineupSchema.index({ owner: 1, updatedAt: -1 }); // lineups updated by a user
LineupSchema.index({ featured: 1, createdAt: -1 }); // featured lineups
LineupSchema.index({ avgRating: -1 }); // lineups with the highest average rating
LineupSchema.index({ totalVotes: -1 }); // lineups with the most votes
LineupSchema.index({ createdAt: -1 }); // lineups created in the last 24 hours

export const LineupModel: Model<LineupDoc> =
  (mongoose.models.Lineup as Model<LineupDoc> | undefined) ??
  mongoose.model<LineupDoc>("Lineup", LineupSchema);
