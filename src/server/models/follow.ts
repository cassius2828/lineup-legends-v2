import mongoose, {
  Schema,
  type Document,
  type Model,
  type Types,
} from "mongoose";
import type { User } from "./user";

// API Type - for responses and client-side usage (after population)
export interface Follow {
  id: string;
  follower: User;
  following: User;
  createdAt: Date;
}

// DB Type - for database operations
export interface FollowDoc extends Document {
  follower: Types.ObjectId; // User who is following
  following: Types.ObjectId; // User who is being followed
  createdAt: Date;
}

const FollowSchema = new Schema<FollowDoc>(
  {
    follower: { type: Schema.Types.ObjectId, ref: "User", required: true },
    following: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
  },
);

// Compound index for efficient lookups
FollowSchema.index({ follower: 1, following: 1 }, { unique: true });
FollowSchema.index({ following: 1 }); // users followed by a user
FollowSchema.index({ follower: 1 }); // users following a user

// Virtual for id
FollowSchema.virtual("id").get(function (this: FollowDoc) {
  return this._id.toHexString();
});

// Ensure virtuals are included in JSON output
FollowSchema.set("toJSON", { virtuals: true });
FollowSchema.set("toObject", { virtuals: true });

export const FollowModel: Model<FollowDoc> =
  (mongoose.models.Follow as Model<FollowDoc> | undefined) ??
  mongoose.model<FollowDoc>("Follow", FollowSchema);
