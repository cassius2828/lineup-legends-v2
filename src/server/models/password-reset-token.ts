import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface PasswordResetTokenDoc extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  token: string;
  expiresAt: Date;
}

const PasswordResetTokenSchema = new Schema<PasswordResetTokenDoc>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  token: { type: String, required: true },
  expiresAt: { type: Date, required: true },
});

PasswordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
PasswordResetTokenSchema.index({ userId: 1 });
PasswordResetTokenSchema.index({ token: 1 });

export const PasswordResetTokenModel: Model<PasswordResetTokenDoc> =
  (mongoose.models.PasswordResetToken as
    | Model<PasswordResetTokenDoc>
    | undefined) ??
  mongoose.model<PasswordResetTokenDoc>(
    "PasswordResetToken",
    PasswordResetTokenSchema,
  );
