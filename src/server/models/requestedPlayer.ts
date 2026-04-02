import mongoose, {
  Schema,
  type Document,
  type Model,
  type Types,
} from "mongoose";
import type { User } from "./user";

// API Type - Value description subdocument for responses (after population)
export interface ValueDescription {
  id: string;
  user: User;
  suggestedValue: number; // 1-5
  note?: string | null;
  createdAt: Date;
}

// DB Type - Value description subdocument for database
export interface ValueDescriptionDoc {
  user: Types.ObjectId;
  suggestedValue: number; // 1-5
  note?: string | null;
  createdAt: Date;
}

const ValueDescriptionSchema = new Schema<ValueDescriptionDoc>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    suggestedValue: { type: Number, required: true, min: 1, max: 5 },
    note: { type: String, maxlength: 500, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// API Type - for responses and client-side usage
export interface RequestedPlayer {
  id: string;
  firstName: string;
  lastName: string;
  descriptions: ValueDescription[];
  createdAt: Date;
  updatedAt: Date;
}

// DB Type - for database operations
export interface RequestedPlayerDoc extends Document {
  firstName: string;
  lastName: string;
  descriptions: ValueDescriptionDoc[];
  createdAt: Date;
  updatedAt: Date;
}

const RequestedPlayerSchema = new Schema<RequestedPlayerDoc>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    descriptions: [ValueDescriptionSchema],
  },
  {
    timestamps: true,
  },
);

// Compound unique index on firstName + lastName (case-insensitive)
RequestedPlayerSchema.index(
  { firstName: 1, lastName: 1 },
  {
    unique: true,
    collation: { locale: "en", strength: 2 }, // Case-insensitive
  },
);

// Virtual for id
RequestedPlayerSchema.virtual("id").get(function (this: RequestedPlayerDoc) {
  return this._id.toHexString();
});

// Ensure virtuals are included in JSON output
RequestedPlayerSchema.set("toJSON", { virtuals: true });
RequestedPlayerSchema.set("toObject", { virtuals: true });

export const RequestedPlayerModel: Model<RequestedPlayerDoc> =
  (mongoose.models.RequestedPlayer as Model<RequestedPlayerDoc> | undefined) ??
  mongoose.model<RequestedPlayerDoc>("RequestedPlayer", RequestedPlayerSchema);
