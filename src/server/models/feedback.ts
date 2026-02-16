import mongoose, { Schema, type Document, type Model } from "mongoose";

export type FeedbackStatus = "new" | "read" | "resolved";

// API Type - for responses and client-side usage
export interface Feedback {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: FeedbackStatus;
  createdAt: Date;
  updatedAt: Date;
}

// DB Type - for database operations
export interface FeedbackDoc extends Document {
  name: string;
  email: string;
  subject: string;
  message: string;
  status: FeedbackStatus;
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackSchema = new Schema<FeedbackDoc>(
  {
    name: { type: String, required: true, maxlength: 100 },
    email: { type: String, required: true, maxlength: 255 },
    subject: { type: String, required: true, maxlength: 200 },
    message: { type: String, required: true, maxlength: 2000 },
    status: {
      type: String,
      enum: ["new", "read", "resolved"],
      default: "new",
    },
  },
  {
    timestamps: true,
  },
);

// Virtual for id
FeedbackSchema.virtual("id").get(function (this: FeedbackDoc) {
  return this._id.toHexString();
});

// Ensure virtuals are included in JSON output
FeedbackSchema.set("toJSON", { virtuals: true });
FeedbackSchema.set("toObject", { virtuals: true });

export const FeedbackModel: Model<FeedbackDoc> =
  (mongoose.models.Feedback as Model<FeedbackDoc> | undefined) ??
  mongoose.model<FeedbackDoc>("Feedback", FeedbackSchema);
