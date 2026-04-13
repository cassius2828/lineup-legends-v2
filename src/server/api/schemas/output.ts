import { z } from "zod";

// ─── Helpers ────────────────────────────────────────────────────────────────────
// Converts MongoDB ObjectId (or string) to a plain string at parse time.
const mongoId = z.preprocess((v) => {
  if (typeof v === "string") return v;
  if (v && typeof v === "object" && "toHexString" in v) {
    return (v as { toHexString: () => string }).toHexString();
  }
  return String(v);
}, z.string());

// ─── Enums ──────────────────────────────────────────────────────────────────────

export const gambleOutcomeTierSchema = z.enum([
  "jackpot",
  "big_win",
  "upgrade",
  "neutral",
  "downgrade",
  "big_loss",
  "disaster",
]);

export const positionSchema = z.enum(["pg", "sg", "sf", "pf", "c"]);

// ─── Player ─────────────────────────────────────────────────────────────────────

export const playerOutput = z.object({
  _id: mongoId,
  id: z.string().optional(),
  firstName: z.string(),
  lastName: z.string(),
  imgUrl: z.string(),
  value: z.number(),
  wikiPageTitle: z.string().nullish(),
  wikiSummaryExtract: z.string().nullish(),
  wikiThumbnailUrl: z.string().nullish(),
  wikiSummaryFetchedAt: z.coerce.date().nullish(),
  wikiAwardsHonorsText: z.string().nullish(),
  /** Mixed in Mongo can round-trip numbers; coerce so UI always gets string values. */
  wikiCareerRegularSeason: z.preprocess((val) => {
    if (val == null) return null;
    if (typeof val !== "object" || Array.isArray(val)) return null;
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      if (v == null) continue;
      const s = typeof v === "string" ? v : String(v);
      if (s.trim().length > 0) out[k] = s.trim();
    }
    return Object.keys(out).length > 0 ? out : null;
  }, z.record(z.string()).nullish()),
  /** Max per stat across season rows (Regular season table). */
  wikiCareerSeasonBests: z.preprocess(
    (val) => {
      if (val == null) return null;
      if (typeof val !== "object" || Array.isArray(val)) return null;
      const out: Record<string, { value: string; season: string }> = {};
      for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
        if (!v || typeof v !== "object") continue;
        const o = v as Record<string, unknown>;
        const value =
          typeof o.value === "string" ? o.value : String(o.value ?? "").trim();
        const season =
          typeof o.season === "string"
            ? o.season
            : String(o.season ?? "").trim();
        if (!value.trim()) continue;
        out[k] = { value: value.trim(), season: season || "—" };
      }
      return Object.keys(out).length > 0 ? out : null;
    },
    z.record(z.object({ value: z.string(), season: z.string() })).nullish(),
  ),
  /** Wikipedia infobox — listed height / weight (personal information) */
  wikiListedHeight: z.string().nullish(),
  wikiListedWeight: z.string().nullish(),
});

export const playersByValueOutput = z
  .object({
    value1Players: z.array(playerOutput),
    value2Players: z.array(playerOutput),
    value3Players: z.array(playerOutput),
    value4Players: z.array(playerOutput),
    value5Players: z.array(playerOutput),
  })
  .optional();

// ─── User variants ─────────────────────────────────────────────────────────────

const socialMediaOutput = z.object({
  twitter: z.string().nullable().optional(),
  instagram: z.string().nullable().optional(),
  facebook: z.string().nullable().optional(),
});

export const userOutput = z.object({
  _id: mongoId,
  id: z.string().optional(),
  name: z.string(),
  username: z.string().nullable().optional(),
  email: z.string().optional(),
  emailVerified: z.coerce.date().nullable().optional(),
  image: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  profileImg: z.string().nullable().optional(),
  bannerImg: z.string().nullable().optional(),
  socialMedia: socialMediaOutput.nullable().optional(),
  followerCount: z.number().default(0),
  followingCount: z.number().default(0),
  admin: z.boolean().optional(),
});

export const userSummaryOutput = z.object({
  _id: mongoId,
  name: z.string(),
  username: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  profileImg: z.string().nullable().optional(),
});

export const userFollowSummaryOutput = userSummaryOutput.extend({
  followerCount: z.number().default(0),
});

const userSessionSummaryOutput = z.object({
  username: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  profileImg: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
});

// ─── Lineup ─────────────────────────────────────────────────────────────────────

export const lineupPlayersOutput = z.object({
  pg: playerOutput,
  sg: playerOutput,
  sf: playerOutput,
  pf: playerOutput,
  c: playerOutput,
});

const lastGambleResultOutput = z.object({
  previousValue: z.number(),
  newValue: z.number(),
  valueChange: z.number(),
  outcomeTier: gambleOutcomeTierSchema,
  position: positionSchema,
  timestamp: z.coerce.date(),
});

export const lineupOutput = z.object({
  _id: mongoId,
  id: z.string().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  featured: z.boolean(),
  players: lineupPlayersOutput,
  owner: userSummaryOutput,
  avgRating: z.number().default(0),
  ratingCount: z.number().default(0),
  ratingSum: z.number().default(0),
  timesGambled: z.number().default(0),
  lastGambleResult: lastGambleResultOutput.nullable().optional(),
  gambleStreak: z.number().default(0),
  dailyGamblesUsed: z.number().default(0),
  dailyGamblesResetAt: z.coerce.date().nullable().optional(),
});

export const paginatedLineupsOutput = z.object({
  lineups: z.array(lineupOutput),
  hasMore: z.boolean(),
  cursor: z.string().optional(),
});

// ─── Comment / Thread ───────────────────────────────────────────────────────────

export const commentOutput = z.object({
  _id: mongoId,
  text: z.string().nullable().optional(),
  user: userSummaryOutput,
  image: z.string().nullable().optional(),
  gif: z.string().nullable().optional(),
  totalVotes: z.number().default(0),
  threadCount: z.number().default(0),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const threadOutput = z.object({
  _id: mongoId,
  text: z.string().nullable().optional(),
  user: userSummaryOutput,
  image: z.string().nullable().optional(),
  gif: z.string().nullable().optional(),
  totalVotes: z.number().default(0),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const addCommentResultOutput = z.object({
  _id: mongoId,
  id: z.string().optional(),
  text: z.string().nullable().optional(),
  lineup: mongoId,
  image: z.string().nullable().optional(),
  gif: z.string().nullable().optional(),
  totalVotes: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  user: userSessionSummaryOutput,
});

export const addThreadResultOutput = z.object({
  _id: mongoId,
  id: z.string().optional(),
  text: z.string().nullable().optional(),
  comment: mongoId,
  image: z.string().nullable().optional(),
  gif: z.string().nullable().optional(),
  totalVotes: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  user: userSessionSummaryOutput,
});

// ─── Paginated wrappers ─────────────────────────────────────────────────────────

export const paginatedCommentsOutput = z.object({
  comments: z.array(commentOutput),
  hasMore: z.boolean(),
  cursor: z.string().optional(),
});

export const paginatedThreadsOutput = z.object({
  threads: z.array(threadOutput),
  hasMore: z.boolean(),
  cursor: z.string().optional(),
});

// ─── Gamble ─────────────────────────────────────────────────────────────────────

export const gambleOutcomeOutput = z.object({
  previousValue: z.number(),
  newValue: z.number(),
  valueChange: z.number(),
  outcomeTier: gambleOutcomeTierSchema,
  streak: z.number(),
});

export const gambleResultOutput = z.object({
  lineup: lineupOutput.nullable(),
  previousPlayer: playerOutput,
  newPlayer: playerOutput,
  outcome: gambleOutcomeOutput,
});

// ─── Follow ─────────────────────────────────────────────────────────────────────

export const followItemOutput = z.object({
  id: z.string(),
  user: userFollowSummaryOutput,
  createdAt: z.coerce.date(),
});

export const paginatedFollowOutput = z.object({
  items: z.array(followItemOutput),
  nextCursor: z.string().optional(),
});

// ─── Search users ───────────────────────────────────────────────────────────────

export const searchUserOutput = z.object({
  _id: mongoId,
  id: z.string(),
  name: z.string(),
  username: z.string().nullable().optional(),
  profileImg: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  followerCount: z.number().default(0),
});

// ─── Profile ────────────────────────────────────────────────────────────────────

export const profileStatsOutput = z.object({
  totalLineups: z.number(),
  avgRating: z.number(),
  highestRatedLineup: lineupOutput.nullable(),
  featuredCount: z.number(),
});

export const profileOutput = z.object({
  _id: mongoId,
  id: z.string(),
  name: z.string(),
  username: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  profileImg: z.string().nullable().optional(),
  bannerImg: z.string().nullable().optional(),
  socialMedia: socialMediaOutput.nullable().optional(),
  followerCount: z.number().default(0),
  followingCount: z.number().default(0),
  lineups: z.array(lineupOutput),
  featuredLineups: z.array(lineupOutput),
  stats: profileStatsOutput,
  _count: z.object({ lineups: z.number() }),
});

export const profileMeOutput = z.object({
  _id: mongoId,
  id: z.string(),
  name: z.string(),
  username: z.string().nullable().optional(),
  email: z.string().optional(),
  image: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  profileImg: z.string().nullable().optional(),
  bannerImg: z.string().nullable().optional(),
  socialMedia: socialMediaOutput.nullable().optional(),
  followerCount: z.number().default(0),
  followingCount: z.number().default(0),
});

// ─── Admin ──────────────────────────────────────────────────────────────────────

export const adminRecentUserOutput = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  image: z.string().nullable(),
  username: z.string().nullable(),
  createdAt: z.coerce.date(),
});

export const adminRecentFeedbackOutput = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  subject: z.string(),
  message: z.string(),
  status: z.string(),
  createdAt: z.coerce.date(),
});

export const adminStatsOutput = z.object({
  totalUsers: z.number(),
  newUsersWeek: z.number(),
  newUsersMonth: z.number(),
  totalLineups: z.number(),
  totalPlayers: z.number(),
  totalRatings: z.number(),
  totalComments: z.number(),
  totalFollows: z.number(),
  pendingFeedback: z.number(),
  totalFeedback: z.number(),
  totalRequestedPlayers: z.number(),
  pendingFlags: z.number(),
  recentUsers: z.array(adminRecentUserOutput),
  recentFeedback: z.array(adminRecentFeedbackOutput),
});

const adminFlagUserOutput = z
  .object({
    id: z.string(),
    name: z.string(),
    username: z.string().nullable(),
    email: z.string(),
    image: z.string().nullable(),
    profileImg: z.string().nullable(),
  })
  .nullable();

const adminFlagItemOutput = z.object({
  id: z.string(),
  contentType: z.string(),
  contentId: z.string().nullable(),
  user: adminFlagUserOutput,
  originalText: z.string(),
  censoredText: z.string(),
  flaggedWords: z.array(z.string()),
  status: z.string(),
  action: z.string().nullable(),
  reviewedBy: z.string().nullable(),
  reviewedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
});

export const adminFlaggedContentOutput = z.object({
  items: z.array(adminFlagItemOutput),
  nextCursor: z.string().optional(),
});

export const adminReviewFlagOutput = z.object({ success: z.boolean() });

const adminUserListItemOutput = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string().nullable(),
  email: z.string(),
  image: z.string().nullable(),
  profileImg: z.string().nullable(),
  banned: z.boolean(),
  bannedAt: z.coerce.date().nullable(),
  banReason: z.string().nullable(),
  suspendedUntil: z.coerce.date().nullable(),
  admin: z.boolean(),
  createdAt: z.coerce.date(),
});

export const adminUsersOutput = z.object({
  items: z.array(adminUserListItemOutput),
  nextCursor: z.string().optional(),
});

const adminCommentSummaryOutput = z.object({
  id: z.string(),
  text: z.string(),
  createdAt: z.coerce.date().nullable().optional(),
  lineupId: z.string(),
});

export const adminUserDetailOutput = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string().nullable(),
  email: z.string(),
  image: z.string().nullable(),
  profileImg: z.string().nullable(),
  bio: z.string().nullable(),
  banned: z.boolean(),
  bannedAt: z.coerce.date().nullable(),
  banReason: z.string().nullable(),
  suspendedUntil: z.coerce.date().nullable(),
  suspensionCount: z.number(),
  admin: z.boolean(),
  registrationIp: z.string().nullable(),
  lastLoginIp: z.string().nullable(),
  followerCount: z.number(),
  followingCount: z.number(),
  createdAt: z.coerce.date(),
  flagCount: z.number(),
  recentComments: z.array(adminCommentSummaryOutput),
});

export const adminBanUserOutput = z.object({ success: z.boolean() });
export const adminUnbanUserOutput = z.object({ success: z.boolean() });

// ─── Feedback ───────────────────────────────────────────────────────────────────

export const feedbackListItemOutput = z.object({
  _id: mongoId,
  id: z.string(),
  name: z.string(),
  email: z.string(),
  subject: z.string(),
  message: z.string(),
  status: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

// ─── Requested Player ───────────────────────────────────────────────────────────

export const requestedPlayerListItemOutput = z.object({
  _id: mongoId,
  id: mongoId,
  firstName: z.string(),
  lastName: z.string(),
  descriptionCount: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

const descriptionUserOutput = z
  .object({
    id: z.string(),
    name: z.string(),
    image: z.string().nullable().optional(),
  })
  .nullable();

export const valueDescriptionOutput = z.object({
  _id: mongoId,
  id: mongoId,
  user: descriptionUserOutput,
  suggestedValue: z.number(),
  note: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
});

export const requestedPlayerDetailOutput = z.object({
  _id: mongoId,
  id: mongoId,
  firstName: z.string(),
  lastName: z.string(),
  descriptions: z.array(valueDescriptionOutput),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

// ─── Video ──────────────────────────────────────────────────────────────────────

const videoTimestampOutput = z.object({
  time: z.number(),
  label: z.string(),
});

export const videoOutput = z.object({
  _id: mongoId,
  id: z.string(),
  youtubeId: z.string(),
  title: z.string(),
  description: z.string(),
  thumbnailUrl: z.string(),
  duration: z.string(),
  timestamps: z.array(videoTimestampOutput),
  addedBy: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

// ─── Vote maps ──────────────────────────────────────────────────────────────────

export const voteMapOutput = z.record(
  z.string(),
  z.enum(["upvote", "downvote"]),
);

// ─── Inferred types ─────────────────────────────────────────────────────────────

export type PlayerOutput = z.infer<typeof playerOutput>;
export type UserOutput = z.infer<typeof userOutput>;
export type UserSummaryOutput = z.infer<typeof userSummaryOutput>;
export type UserFollowSummaryOutput = z.infer<typeof userFollowSummaryOutput>;
export type LineupPlayersOutput = z.infer<typeof lineupPlayersOutput>;
export type LineupOutput = z.infer<typeof lineupOutput>;
export type PaginatedLineupsOutput = z.infer<typeof paginatedLineupsOutput>;
export type CommentOutput = z.infer<typeof commentOutput>;
export type ThreadOutput = z.infer<typeof threadOutput>;
export type GambleOutcomeTier = z.infer<typeof gambleOutcomeTierSchema>;
export type GambleResultOutput = z.infer<typeof gambleResultOutput>;
export type FollowItemOutput = z.infer<typeof followItemOutput>;
export type SearchUserOutput = z.infer<typeof searchUserOutput>;
export type ProfileOutput = z.infer<typeof profileOutput>;
export type ProfileMeOutput = z.infer<typeof profileMeOutput>;
export type AdminStatsOutput = z.infer<typeof adminStatsOutput>;
export type FeedbackListItemOutput = z.infer<typeof feedbackListItemOutput>;
export type RequestedPlayerListItemOutput = z.infer<
  typeof requestedPlayerListItemOutput
>;
export type RequestedPlayerDetailOutput = z.infer<
  typeof requestedPlayerDetailOutput
>;
export type VideoOutput = z.infer<typeof videoOutput>;
export type PlayersByValueOutput = z.infer<typeof playersByValueOutput>;

// Mongoose's `.populate().lean()` returns correct data at runtime but
// TypeScript still types populated refs as ObjectId. This helper bypasses
// the compile-time check — the Zod `.output()` schema validates at runtime.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const populated = <T>(value: T): any => value;
