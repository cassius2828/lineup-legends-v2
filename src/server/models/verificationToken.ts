import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IVerificationToken extends Document {
  _id: mongoose.Types.ObjectId;
  identifier: string;
  token: string;
  expires: Date;
}

const VerificationTokenSchema = new Schema<IVerificationToken>(
  {
    identifier: { type: String, required: true },
    token: { type: String, required: true, unique: true },
    expires: { type: Date, required: true },
  },
  {
    timestamps: false,
  }
);

// Compound unique index for identifier + token
VerificationTokenSchema.index({ identifier: 1, token: 1 }, { unique: true });

// Virtual for id
VerificationTokenSchema.virtual("id").get(function (this: IVerificationToken) {
  return this._id.toHexString();
});

// Ensure virtuals are included in JSON output
VerificationTokenSchema.set("toJSON", { virtuals: true });
VerificationTokenSchema.set("toObject", { virtuals: true });

export const VerificationToken: Model<IVerificationToken> =
  (mongoose.models.VerificationToken as Model<IVerificationToken> | undefined) ??
  mongoose.model<IVerificationToken>("VerificationToken", VerificationTokenSchema);
