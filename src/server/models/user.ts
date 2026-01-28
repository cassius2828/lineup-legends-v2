import mongoose, {
  Schema,
  type Document,
  type Model,
  type Types,
} from "mongoose";

export interface ISocialMedia {
  twitter?: string | null;
  instagram?: string | null;
  facebook?: string | null;
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  password?: string | null;
  username?: string | null;
  email: string;
  emailVerified?: Date | null;
  image?: string | null;
  bio?: string | null;
  profileImg?: string | null;
  bannerImg?: string | null;
  friends: Types.ObjectId[];
  socialMedia?: ISocialMedia;
  newEmail?: string | null;
  emailConfirmationToken?: string | null;
  admin?: boolean;
}

const SocialMediaSchema = new Schema<ISocialMedia>(
  {
    twitter: { type: String, default: null },
    instagram: { type: String, default: null },
    facebook: { type: String, default: null },
  },
  { _id: false },
);

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    password: { type: String, required: false, default: null },
    username: { type: String, required: false, unique: true, sparse: true },
    email: { type: String, required: true, unique: true },
    emailVerified: { type: Date, default: null },
    image: { type: String, default: null },
    bio: { type: String, default: null, maxlength: 250 },
    profileImg: { type: String, default: null },
    bannerImg: { type: String, default: null },
    friends: [{ type: Schema.Types.ObjectId, ref: "User" }],
    socialMedia: { type: SocialMediaSchema, default: null },
    newEmail: { type: String, default: null },
    emailConfirmationToken: { type: String, default: null },
    admin: { type: Boolean, default: false },
  },
  {
    timestamps: false,
  },
);

// Virtual for id
UserSchema.virtual("id").get(function (this: IUser) {
  return this._id.toHexString();
});

// Ensure virtuals are included in JSON output
UserSchema.set("toJSON", { virtuals: true });
UserSchema.set("toObject", { virtuals: true });

export const User: Model<IUser> =
  (mongoose.models.User as Model<IUser> | undefined) ??
  mongoose.model<IUser>("User", UserSchema);
