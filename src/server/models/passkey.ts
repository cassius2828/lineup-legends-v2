import mongoose, { Schema, type Document, type Model } from "mongoose";

export type PasskeyDeviceType = "singleDevice" | "multiDevice";

export interface PasskeyDoc extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  credentialId: string;
  publicKey: Buffer;
  counter: number;
  deviceType: PasskeyDeviceType;
  backedUp: boolean;
  transports?: string[];
  name: string;
  createdAt: Date;
}

const PasskeySchema = new Schema<PasskeyDoc>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  credentialId: { type: String, required: true, unique: true },
  publicKey: { type: Buffer, required: true },
  counter: { type: Number, required: true, default: 0 },
  deviceType: {
    type: String,
    enum: ["singleDevice", "multiDevice"],
    required: true,
    default: "singleDevice",
  },
  backedUp: { type: Boolean, required: true, default: false },
  transports: { type: [String], default: undefined },
  name: { type: String, required: true, default: "My Passkey" },
  createdAt: { type: Date, default: Date.now },
});

PasskeySchema.index({ userId: 1 });

PasskeySchema.virtual("id").get(function (this: PasskeyDoc) {
  return this._id.toHexString();
});

PasskeySchema.set("toJSON", { virtuals: true });
PasskeySchema.set("toObject", { virtuals: true });

export const PasskeyModel: Model<PasskeyDoc> =
  (mongoose.models.Passkey as Model<PasskeyDoc> | undefined) ??
  mongoose.model<PasskeyDoc>("Passkey", PasskeySchema);
