import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  password: string;
  username: string;
  email: string;
  emailVerified?: Date | null;
  image?: string | null;
  bio?: string | null;
  profileImg?: string | null;
  bannerImg?: string | null;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    password: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    emailVerified: { type: Date, default: null },
    image: { type: String, default: null },
    bio: { type: String, default: null, maxlength: 250 },
    profileImg: { type: String, default: null },
    bannerImg: { type: String, default: null },
  },
  {
    timestamps: false,
  }
);

// Virtual for id
UserSchema.virtual("id").get(function (this: IUser) {
  return this._id.toHexString();
});

// Ensure virtuals are included in JSON output
UserSchema.set("toJSON", { virtuals: true });
UserSchema.set("toObject", { virtuals: true });

export const User: Model<IUser> =
  (mongoose.models.User as Model<IUser> | undefined) ?? mongoose.model<IUser>("User", UserSchema);
