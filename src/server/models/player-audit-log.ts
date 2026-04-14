import mongoose, { Schema, type Document, type Model } from "mongoose";

export type PlayerAuditAction = "create" | "update" | "delete";

export interface PlayerSnapshot {
  firstName: string;
  lastName: string;
  value: number;
  imgUrl: string;
}

export interface PlayerAuditLogDoc extends Document {
  playerId: mongoose.Types.ObjectId;
  action: PlayerAuditAction;
  performedBy: mongoose.Types.ObjectId;
  performedByEmail: string;
  before: PlayerSnapshot | null;
  after: PlayerSnapshot | null;
  timestamp: Date;
}

const PlayerSnapshotSchema = new Schema<PlayerSnapshot>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    value: { type: Number, required: true },
    imgUrl: { type: String, required: true },
  },
  { _id: false },
);

const PlayerAuditLogSchema = new Schema<PlayerAuditLogDoc>(
  {
    playerId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: ["create", "update", "delete"],
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    performedByEmail: { type: String, required: true },
    before: { type: PlayerSnapshotSchema, default: null },
    after: { type: PlayerSnapshotSchema, default: null },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false },
);

PlayerAuditLogSchema.index({ timestamp: -1 });

export const PlayerAuditLogModel: Model<PlayerAuditLogDoc> =
  (mongoose.models.PlayerAuditLog as Model<PlayerAuditLogDoc> | undefined) ??
  mongoose.model<PlayerAuditLogDoc>("PlayerAuditLog", PlayerAuditLogSchema);
