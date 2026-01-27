import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";
import type { IUser } from "./user";

export type FriendStatus = "requested" | "pending" | "accepted";

export interface IFriend extends Document {
  _id: mongoose.Types.ObjectId;
  requesterId: Types.ObjectId;
  requester?: IUser;
  recipientId: Types.ObjectId;
  recipient?: IUser;
  status: FriendStatus;
  createdAt: Date;
  updatedAt: Date;
}

const FriendSchema = new Schema<IFriend>(
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
  }
);

// Compound index for efficient lookups
FriendSchema.index({ requesterId: 1, recipientId: 1 }, { unique: true });
FriendSchema.index({ recipientId: 1, status: 1 });
FriendSchema.index({ requesterId: 1, status: 1 });

// Virtual for id
FriendSchema.virtual("id").get(function (this: IFriend) {
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

export const Friend: Model<IFriend> =
  (mongoose.models.Friend as Model<IFriend> | undefined) ?? mongoose.model<IFriend>("Friend", FriendSchema);
