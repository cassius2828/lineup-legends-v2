import mongoose, {
  Schema,
  type Document,
  type Model,
  type Types,
} from "mongoose";
import type { User } from "./user";

// API Type - for responses and client-side usage (after population)
export interface Session {
  id: string;
  user: User;
  expires: Date;
}

// DB Type - for database operations
export interface SessionDoc extends Document {
  sessionToken: string;
  user: Types.ObjectId;
  expires: Date;
}

const SessionSchema = new Schema<SessionDoc>(
  {
    sessionToken: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    expires: { type: Date, required: true },
  },
  {
    timestamps: true,
  },
);

// Virtual for id
SessionSchema.virtual("id").get(function (this: SessionDoc) {
  return this._id.toHexString();
});
// add indexes (sessionToken index already created via `unique: true` in field def)
SessionSchema.index({ user: 1 });
SessionSchema.index({ expires: 1 });
// Ensure virtuals are included in JSON output
SessionSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform(_doc, ret) {
    const obj = ret as unknown as Record<string, unknown>;
    obj.id = (obj._id as Types.ObjectId)?.toString() ?? obj.id;
    obj.user = (obj.user as Types.ObjectId)?.toString() ?? obj.user;
    delete obj._id;
    delete obj.sessionToken;
    return obj;
  },
});
SessionSchema.set("toObject", { virtuals: true });

export const SessionModel: Model<SessionDoc> =
  (mongoose.models.Session as Model<SessionDoc> | undefined) ??
  mongoose.model<SessionDoc>("Session", SessionSchema);
