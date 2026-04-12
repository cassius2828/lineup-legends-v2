import mongoose, { Schema, type Document, type Model } from "mongoose";

// API Type - for responses and client-side usage
export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  imgUrl: string;
  value: number; // 1-5 representing player cost
  wikiPageTitle?: string | null;
  wikiSummaryExtract?: string | null;
  wikiThumbnailUrl?: string | null;
  wikiSummaryFetchedAt?: Date | null;
  /** Plain text from Wikipedia "Awards and honors" section */
  wikiAwardsHonorsText?: string | null;
  /** NBA regular-season career row (from Wikipedia stats table) */
  wikiCareerRegularSeason?: Record<string, string> | null;
  /** Highest value per stat across season rows (not career averages). */
  wikiCareerSeasonBests?: Record<
    string,
    { value: string; season: string }
  > | null;
  /** Wikipedia infobox: listed height (e.g. 6 ft 9 in (2.06 m)) */
  wikiListedHeight?: string | null;
  /** Wikipedia infobox: listed weight */
  wikiListedWeight?: string | null;
}

// DB Type - for database operations
export interface PlayerDoc extends Document {
  firstName: string;
  lastName: string;
  imgUrl: string;
  value: number; // 1-5 representing player cost
  wikiPageTitle?: string | null;
  wikiSummaryExtract?: string | null;
  wikiThumbnailUrl?: string | null;
  wikiSummaryFetchedAt?: Date | null;
  /** Plain text from Wikipedia "Awards and honors" section */
  wikiAwardsHonorsText?: string | null;
  /** NBA regular-season career row (from Wikipedia stats table) */
  wikiCareerRegularSeason?: Record<string, string> | null;
  /** Highest value per stat across season rows (not career averages). */
  wikiCareerSeasonBests?: Record<
    string,
    { value: string; season: string }
  > | null;
  /** Wikipedia infobox: listed height (e.g. 6 ft 9 in (2.06 m)) */
  wikiListedHeight?: string | null;
  /** Wikipedia infobox: listed weight */
  wikiListedWeight?: string | null;
}

const PlayerSchema = new Schema<PlayerDoc>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    imgUrl: { type: String, required: true },
    value: { type: Number, required: true, min: 1, max: 5 },
    wikiPageTitle: { type: String, default: null },
    wikiSummaryExtract: { type: String, default: null },
    wikiThumbnailUrl: { type: String, default: null },
    wikiSummaryFetchedAt: { type: Date, default: null },
    wikiAwardsHonorsText: { type: String, default: null },
    wikiCareerRegularSeason: { type: Schema.Types.Mixed, default: null },
    wikiCareerSeasonBests: { type: Schema.Types.Mixed, default: null },
    wikiListedHeight: { type: String, default: null },
    wikiListedWeight: { type: String, default: null },
  },
  {
    timestamps: false,
  },
);

// Virtual for id (to match Prisma's id field)
PlayerSchema.virtual("id").get(function (this: PlayerDoc) {
  return this._id.toHexString();
});

// Ensure virtuals are included in JSON output
PlayerSchema.set("toJSON", { virtuals: true });
PlayerSchema.set("toObject", { virtuals: true });

// add index for text and value fields
PlayerSchema.index({ firstName: "text", lastName: "text", value: 1 });
export const PlayerModel: Model<PlayerDoc> =
  (mongoose.models.Player as Model<PlayerDoc> | undefined) ??
  mongoose.model<PlayerDoc>("Player", PlayerSchema);
