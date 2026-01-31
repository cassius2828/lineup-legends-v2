import mongoose, {
  Schema,
  type Document,
  type Model,
  type Types,
} from "mongoose";
import type { User } from "./user";

export type FriendStatus = "requested" | "pending" | "accepted";

// API Type - for responses and client-side usage (after population)
export interface Friend {
  id: string;
  requesterId: string;
  requester?: User;
  recipientId: string;
  recipient?: User;
  status: FriendStatus;
  createdAt: Date;
  updatedAt: Date;
}

// DB Type - for database operations
export interface FriendDoc extends Document {
  requesterId: Types.ObjectId;
  requester?: User;
  recipientId: Types.ObjectId;
  recipient?: User;
  status: FriendStatus;
  createdAt: Date;
  updatedAt: Date;
}

const FriendSchema = new Schema<FriendDoc>(
  {
    requesterId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    recipientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["requested", "pending", "accepted"],
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index for efficient lookups
FriendSchema.index({ requesterId: 1, recipientId: 1 }, { unique: true });
FriendSchema.index({ recipientId: 1, status: 1 });
FriendSchema.index({ requesterId: 1, status: 1 });

// Virtual for id
FriendSchema.virtual("id").get(function (this: FriendDoc) {
  return this._id.toHexString();
});

// Virtual populations
FriendSchema.virtual("requester", {
  ref: "User",
  localField: "requesterId",
  foreignField: "_id",
  justOne: true,
});

FriendSchema.virtual("recipient", {
  ref: "User",
  localField: "recipientId",
  foreignField: "_id",
  justOne: true,
});

// Ensure virtuals are included in JSON output
FriendSchema.set("toJSON", { virtuals: true });
FriendSchema.set("toObject", { virtuals: true });

export const FriendModel: Model<FriendDoc> =
  (mongoose.models.Friend as Model<FriendDoc> | undefined) ??
  mongoose.model<FriendDoc>("Friend", FriendSchema);
