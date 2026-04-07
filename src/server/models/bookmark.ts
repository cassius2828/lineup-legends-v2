import mongoose, {
  Schema,
  type Document,
  type Model,
  type Types,
} from "mongoose";
import type { User } from "./user";
import type { Lineup } from "./lineup";

export interface Bookmark {
  id: string;
  user: User;
  lineup: Lineup;
  createdAt: Date;
}

export interface BookmarkDoc extends Document {
  user: Types.ObjectId;
  lineup: Types.ObjectId;
  createdAt: Date;
}

const BookmarkSchema = new Schema<BookmarkDoc>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    lineup: { type: Schema.Types.ObjectId, ref: "Lineup", required: true },
  },
  {
    timestamps: true,
  },
);

BookmarkSchema.index({ user: 1, lineup: 1 }, { unique: true });
BookmarkSchema.index({ user: 1, createdAt: -1 });

BookmarkSchema.virtual("id").get(function (this: BookmarkDoc) {
  return this._id.toHexString();
});

BookmarkSchema.set("toJSON", { virtuals: true });
BookmarkSchema.set("toObject", { virtuals: true });

export const BookmarkModel: Model<BookmarkDoc> =
  (mongoose.models.Bookmark as Model<BookmarkDoc> | undefined) ??
  mongoose.model<BookmarkDoc>("Bookmark", BookmarkSchema);
