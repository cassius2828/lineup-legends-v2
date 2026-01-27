import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export interface ISession extends Document {
  _id: mongoose.Types.ObjectId;
  sessionToken: string;
  userId: Types.ObjectId;
  expires: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    sessionToken: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    expires: { type: Date, required: true },
  },
  {
    timestamps: false,
  }
);

// Virtual for id
SessionSchema.virtual("id").get(function (this: ISession) {
  return this._id.toHexString();
});

// Ensure virtuals are included in JSON output
SessionSchema.set("toJSON", { virtuals: true });
SessionSchema.set("toObject", { virtuals: true });

export const Session: Model<ISession> =
  (mongoose.models.Session as Model<ISession> | undefined) ?? mongoose.model<ISession>("Session", SessionSchema);
