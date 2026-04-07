import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export interface VideoTimestamp {
  time: number;
  label: string;
}

export interface VideoTimestampDoc {
  time: number;
  label: string;
}

// API Type
export interface Video {
  id: string;
  youtubeId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  duration: string;
  timestamps: VideoTimestamp[];
  addedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// DB Type
export interface VideoDoc extends Document {
  youtubeId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  duration: string;
  timestamps: VideoTimestampDoc[];
  addedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const VideoTimestampSchema = new Schema<VideoTimestampDoc>(
  {
    time: { type: Number, required: true },
    label: { type: String, required: true, maxlength: 200 },
  },
  { _id: false },
);

const VideoSchema = new Schema<VideoDoc>(
  {
    youtubeId: { type: String, required: true, unique: true },
    title: { type: String, required: true, maxlength: 500 },
    description: { type: String, default: "" },
    thumbnailUrl: { type: String, required: true },
    duration: { type: String, default: "" },
    timestamps: { type: [VideoTimestampSchema], default: [] },
    addedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
  },
);

VideoSchema.virtual("id").get(function (this: VideoDoc) {
  return this._id.toHexString();
});

VideoSchema.set("toJSON", { virtuals: true });
VideoSchema.set("toObject", { virtuals: true });

export const VideoModel: Model<VideoDoc> =
  (mongoose.models.Video as Model<VideoDoc> | undefined) ??
  mongoose.model<VideoDoc>("Video", VideoSchema);
