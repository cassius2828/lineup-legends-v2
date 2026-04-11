import mongoose, {
  Schema,
  type Document,
  type Model,
  type Types,
} from "mongoose";

export type ContentFlagType =
  | "comment"
  | "thread"
  | "username"
  | "bio"
  | "feedback"
  | "player-request"
  | "registration";

export type ContentFlagStatus = "pending" | "reviewed" | "dismissed";
export type ContentFlagAction = "none" | "warn" | "suspend" | "ban";

export interface ContentFlagDoc extends Document {
  _id: Types.ObjectId;
  contentType: ContentFlagType;
  contentId: Types.ObjectId | null;
  userId: Types.ObjectId | null;
  originalText: string;
  censoredText: string;
  flaggedWords: string[];
  status: ContentFlagStatus;
  reviewedBy: Types.ObjectId | null;
  reviewedAt: Date | null;
  action: ContentFlagAction | null;
  createdAt: Date;
}

const ContentFlagSchema = new Schema<ContentFlagDoc>(
  {
    contentType: {
      type: String,
      enum: [
        "comment",
        "thread",
        "username",
        "bio",
        "feedback",
        "player-request",
        "registration",
      ],
      required: true,
    },
    contentId: { type: Schema.Types.ObjectId, default: null },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    originalText: { type: String, required: true },
    censoredText: { type: String, required: true },
    flaggedWords: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["pending", "reviewed", "dismissed"],
      default: "pending",
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: { type: Date, default: null },
    action: {
      type: String,
      enum: ["none", "warn", "suspend", "ban"],
      default: null,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

ContentFlagSchema.index({ status: 1, createdAt: -1 });
ContentFlagSchema.index({ userId: 1 });

export const ContentFlagModel: Model<ContentFlagDoc> =
  (mongoose.models.ContentFlag as Model<ContentFlagDoc> | undefined) ??
  mongoose.model<ContentFlagDoc>("ContentFlag", ContentFlagSchema);
