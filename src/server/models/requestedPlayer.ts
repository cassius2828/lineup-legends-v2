import mongoose, {
  Schema,
  type Document,
  type Model,
  type Types,
} from "mongoose";
import type { IUser } from "./user";

// Value description subdocument
export interface IValueDescription {
  _id: mongoose.Types.ObjectId;
  userId: Types.ObjectId;
  user?: IUser;
  suggestedValue: number; // 1-5
  createdAt: Date;
}

const ValueDescriptionSchema = new Schema<IValueDescription>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    suggestedValue: { type: Number, required: true, min: 1, max: 5 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

// Main RequestedPlayer document
export interface IRequestedPlayer extends Document {
  _id: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  descriptions: IValueDescription[];
  createdAt: Date;
  updatedAt: Date;
}

const RequestedPlayerSchema = new Schema<IRequestedPlayer>(
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
RequestedPlayerSchema.virtual("id").get(function (this: IRequestedPlayer) {
  return this._id.toHexString();
});

// Ensure virtuals are included in JSON output
RequestedPlayerSchema.set("toJSON", { virtuals: true });
RequestedPlayerSchema.set("toObject", { virtuals: true });

export const RequestedPlayer: Model<IRequestedPlayer> =
  (mongoose.models.RequestedPlayer as Model<IRequestedPlayer> | undefined) ??
  mongoose.model<IRequestedPlayer>("RequestedPlayer", RequestedPlayerSchema);
