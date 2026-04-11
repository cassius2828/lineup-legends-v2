import mongoose, { Schema, type Document, type Model } from "mongoose";

export type MfaMethod = "totp" | "email" | "passkey";

export interface SocialMedia {
  twitter?: string | null;
  instagram?: string | null;
  facebook?: string | null;
}

// API Type - for responses and client-side usage (after population)
export interface User {
  id: string;
  name: string;
  username?: string | null;
  email: string;
  emailVerified?: Date | null;
  image?: string | null;
  bio?: string | null;
  profileImg?: string | null;
  bannerImg?: string | null;
  socialMedia?: SocialMedia;
  followerCount: number;
  followingCount: number;
  newEmail?: string | null;
  emailConfirmationToken?: string | null;
  emailConfirmationExpiresAt?: Date | null;
  admin?: boolean;
  banned?: boolean;
  bannedAt?: Date | null;
  banReason?: string | null;
  suspendedUntil?: Date | null;
  suspensionCount?: number;
  registrationIp?: string | null;
  lastLoginIp?: string | null;
  mfaEnabled: boolean;
  mfaMethods: MfaMethod[];
  totpSecret?: string | null;
  pendingTotpSecret?: string | null;
}

// DB Type - for database operations
export interface UserDoc extends Document {
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
  socialMedia?: SocialMedia;
  followerCount: number;
  followingCount: number;
  newEmail?: string | null;
  emailConfirmationToken?: string | null;
  emailConfirmationExpiresAt?: Date | null;
  admin?: boolean;
  banned?: boolean;
  bannedAt?: Date | null;
  banReason?: string | null;
  suspendedUntil?: Date | null;
  suspensionCount?: number;
  registrationIp?: string | null;
  lastLoginIp?: string | null;
  mfaEnabled: boolean;
  mfaMethods: MfaMethod[];
  totpSecret?: string | null;
  pendingTotpSecret?: string | null;
}

const SocialMediaSchema = new Schema<SocialMedia>(
  {
    twitter: { type: String, default: null },
    instagram: { type: String, default: null },
    facebook: { type: String, default: null },
  },
  { _id: false },
);

const UserSchema = new Schema<UserDoc>(
  {
    name: { type: String, required: true },
    password: { type: String, required: false, default: null, select: false },
    username: { type: String, required: false },
    email: { type: String, required: true, unique: true },
    emailVerified: { type: Date, default: null },
    image: { type: String, default: null },
    bio: { type: String, default: null, maxlength: 250 },
    profileImg: { type: String, default: null },
    bannerImg: { type: String, default: null },
    socialMedia: { type: SocialMediaSchema, default: null },
    followerCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    newEmail: { type: String, default: null },
    emailConfirmationToken: { type: String, default: null },
    emailConfirmationExpiresAt: { type: Date, default: null },
    admin: { type: Boolean, default: false },
    banned: { type: Boolean, default: false },
    bannedAt: { type: Date, default: null },
    banReason: { type: String, default: null },
    suspendedUntil: { type: Date, default: null },
    suspensionCount: { type: Number, default: 0 },
    registrationIp: { type: String, default: null },
    lastLoginIp: { type: String, default: null },
    mfaEnabled: { type: Boolean, default: false },
    mfaMethods: {
      type: [{ type: String, enum: ["totp", "email", "passkey"] }],
      default: [],
    },
    totpSecret: { type: String, default: null },
    pendingTotpSecret: { type: String, default: null },
  },
  {
    timestamps: false,
  },
);

UserSchema.index({ username: 1 }, { unique: true, sparse: true });
UserSchema.index({ name: 1 });

// Virtual for id
UserSchema.virtual("id").get(function (this: UserDoc) {
  return this._id.toHexString();
});

// Ensure virtuals are included in JSON output
UserSchema.set("toJSON", { virtuals: true });
UserSchema.set("toObject", { virtuals: true });

export const UserModel: Model<UserDoc> =
  (mongoose.models.User as Model<UserDoc> | undefined) ??
  mongoose.model<UserDoc>("User", UserSchema);
