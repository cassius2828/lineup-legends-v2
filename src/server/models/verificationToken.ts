import mongoose, { Schema, type Document, type Model } from "mongoose";

// API Type - for responses and client-side usage
export interface VerificationToken {
  id: string;
  identifier: string;
  expires: Date;
}

// DB Type - for database operations
export interface VerificationTokenDoc extends Document {
  _id: mongoose.Types.ObjectId;
  identifier: string;
  token: string;
  expires: Date;
}

const VerificationTokenSchema = new Schema<VerificationTokenDoc>(
  {
    identifier: { type: String, required: true },
    token: { type: String, required: true, unique: true },
    expires: { type: Date, required: true },
  },
  {
    timestamps: false,
  },
);

// Compound unique index for identifier + token
VerificationTokenSchema.index({ identifier: 1, token: 1 }, { unique: true });

// Virtual for id
VerificationTokenSchema.virtual("id").get(function (
  this: VerificationTokenDoc,
) {
  return this._id.toHexString();
});

// Ensure virtuals are included in JSON output
VerificationTokenSchema.set("toJSON", { virtuals: true });
VerificationTokenSchema.set("toObject", { virtuals: true });

export const VerificationTokenModel: Model<VerificationTokenDoc> =
  (mongoose.models.VerificationToken as
    | Model<VerificationTokenDoc>
    | undefined) ??
  mongoose.model<VerificationTokenDoc>(
    "VerificationToken",
    VerificationTokenSchema,
  );
