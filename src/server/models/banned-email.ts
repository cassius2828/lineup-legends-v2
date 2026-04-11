import mongoose, {
  Schema,
  type Document,
  type Model,
  type Types,
} from "mongoose";

export interface BannedEmailDoc extends Document {
  _id: Types.ObjectId;
  email: string;
  bannedBy: Types.ObjectId;
  reason: string;
  createdAt: Date;
}

const BannedEmailSchema = new Schema<BannedEmailDoc>(
  {
    email: { type: String, required: true },
    bannedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

BannedEmailSchema.index({ email: 1 }, { unique: true });

export const BannedEmailModel: Model<BannedEmailDoc> =
  (mongoose.models.BannedEmail as Model<BannedEmailDoc> | undefined) ??
  mongoose.model<BannedEmailDoc>("BannedEmail", BannedEmailSchema);
