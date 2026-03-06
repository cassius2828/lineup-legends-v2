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

// Gamble outcome tier for visual feedback
export type GambleOutcomeTier =
  | "jackpot" // +3 or +4 value jump
  | "big_win" // +2 value jump
  | "upgrade" // +1 value jump
  | "neutral" // same value
  | "downgrade" // -1 value drop
  | "big_loss" // -2 value drop
  | "disaster"; // -3 or -4 value drop

// Last gamble result tracking
export interface LastGambleResult {
  previousValue: number;
  newValue: number;
  valueChange: number;
  outcomeTier: GambleOutcomeTier;
  position: "pg" | "sg" | "sf" | "pf" | "c";
  timestamp: Date;
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
  ratingCount: number;
  ratingSum: number;
  timesGambled: number;
  // Gambling tracking fields
  lastGambleResult?: LastGambleResult;
  gambleStreak: number; // consecutive upgrades (positive) or downgrades (negative)
  lastGambleAt?: Date;
  dailyGamblesUsed: number;
  dailyGamblesResetAt?: Date;
}

// DB Type - Last gamble result for database
export interface LastGambleResultDoc {
  previousValue: number;
  newValue: number;
  valueChange: number;
  outcomeTier: GambleOutcomeTier;
  position: "pg" | "sg" | "sf" | "pf" | "c";
  timestamp: Date;
}

// DB Type - for database operations
export interface LineupDoc extends Document {
  createdAt: Date;
  updatedAt: Date;
  featured: boolean;
  players: LineupPlayersDoc;
  owner: Types.ObjectId;
  avgRating: number;
  ratingCount: number;
  ratingSum: number;
  timesGambled: number;
  // Gambling tracking fields
  lastGambleResult?: LastGambleResultDoc;
  gambleStreak: number;
  lastGambleAt?: Date;
  dailyGamblesUsed: number;
  dailyGamblesResetAt?: Date;
}

// Subdocument schema for last gamble result
const LastGambleResultSchema = new Schema<LastGambleResultDoc>(
  {
    previousValue: { type: Number, required: true },
    newValue: { type: Number, required: true },
    valueChange: { type: Number, required: true },
    outcomeTier: {
      type: String,
      enum: [
        "jackpot",
        "big_win",
        "upgrade",
        "neutral",
        "downgrade",
        "big_loss",
        "disaster",
      ],
      required: true,
    },
    position: {
      type: String,
      enum: ["pg", "sg", "sf", "pf", "c"],
      required: true,
    },
    timestamp: { type: Date, required: true },
  },
  { _id: false },
);

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
    avgRating: { type: Number, default: 0 },
    timesGambled: { type: Number, default: 0 },
    // Gambling tracking fields
    lastGambleResult: { type: LastGambleResultSchema, default: undefined },
    gambleStreak: { type: Number, default: 0 },
    lastGambleAt: { type: Date, default: undefined },
    dailyGamblesUsed: { type: Number, default: 0 },
    dailyGamblesResetAt: { type: Date, default: undefined },
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

// add index on owner, avgRating
LineupSchema.index({ owner: 1, createdAt: -1 }); // lineups created by a user
LineupSchema.index({ owner: 1, updatedAt: -1 }); // lineups updated by a user
LineupSchema.index({ featured: 1, createdAt: -1 }); // featured lineups
LineupSchema.index({ avgRating: -1 }); // lineups with the highest average rating
LineupSchema.index({ ratingCount: -1 }); // lineups with the most ratings
LineupSchema.index({ createdAt: -1 }); // lineups created in the last 24 hours

export const LineupModel: Model<LineupDoc> =
  (mongoose.models.Lineup as Model<LineupDoc> | undefined) ??
  mongoose.model<LineupDoc>("Lineup", LineupSchema);
