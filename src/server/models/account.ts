import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export interface IAccount extends Document {
  _id: mongoose.Types.ObjectId;
  userId: Types.ObjectId;
  type: string;
  provider: string;
  providerAccountId: string;
  refresh_token?: string | null;
  access_token?: string | null;
  expires_at?: number | null;
  token_type?: string | null;
  scope?: string | null;
  id_token?: string | null;
  session_state?: string | null;
  refresh_token_expires_in?: number | null;
}

const AccountSchema = new Schema<IAccount>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true },
    provider: { type: String, required: true },
    providerAccountId: { type: String, required: true },
    refresh_token: { type: String, default: null },
    access_token: { type: String, default: null },
    expires_at: { type: Number, default: null },
    token_type: { type: String, default: null },
    scope: { type: String, default: null },
    id_token: { type: String, default: null },
    session_state: { type: String, default: null },
    refresh_token_expires_in: { type: Number, default: null },
  },
  {
    timestamps: false,
  }
);

// Compound unique index for provider + providerAccountId
AccountSchema.index({ provider: 1, providerAccountId: 1 }, { unique: true });

// Virtual for id
AccountSchema.virtual("id").get(function (this: IAccount) {
  return this._id.toHexString();
});

// Ensure virtuals are included in JSON output
AccountSchema.set("toJSON", { virtuals: true });
AccountSchema.set("toObject", { virtuals: true });

export const Account: Model<IAccount> =
  (mongoose.models.Account as Model<IAccount> | undefined) ?? mongoose.model<IAccount>("Account", AccountSchema);
