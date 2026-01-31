import mongoose, {
  Schema,
  type Document,
  type Model,
  type Types,
} from "mongoose";
import type { User } from "./user";
import type { Lineup } from "./lineup";

// API Type - for responses and client-side usage (after population)
export interface LineupVote {
  id: string;
  type: "upvote" | "downvote";
  user: User;
  lineup: Lineup;
  createdAt: Date;
}

// DB Type - for database operations
export interface LineupVoteDoc extends Document {
  type: "upvote" | "downvote";
  user: Types.ObjectId;
  lineup: Types.ObjectId;
  createdAt: Date;
}

const LineupVoteSchema = new Schema<LineupVoteDoc>(
  {
    type: { type: String, enum: ["upvote", "downvote"], required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    lineup: { type: Schema.Types.ObjectId, ref: "Lineup", required: true },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
  },
);

// Compound unique index for one vote per user per lineup
LineupVoteSchema.index({ user: 1, lineup: 1 }, { unique: true });

// Virtual for id
LineupVoteSchema.virtual("id").get(function (this: LineupVoteDoc) {
  return this._id.toHexString();
});

// Ensure virtuals are included in JSON output
LineupVoteSchema.set("toJSON", { virtuals: true });
LineupVoteSchema.set("toObject", { virtuals: true });

export const LineupVoteModel: Model<LineupVoteDoc> =
  (mongoose.models.LineupVote as Model<LineupVoteDoc> | undefined) ??
  mongoose.model<LineupVoteDoc>("LineupVote", LineupVoteSchema);
