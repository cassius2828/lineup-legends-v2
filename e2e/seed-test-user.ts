import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI is required in .env");
  process.exit(1);
}

function isRemoteUri(uri: string): boolean {
  return /mongodb\+srv|\.mongodb\.net/i.test(uri);
}

if (isRemoteUri(MONGODB_URI) && !process.env.E2E_ALLOW_REMOTE_DB) {
  console.error(
    "\n🚨 SAFETY: MONGODB_URI points to a remote/Atlas database.\n" +
      "E2E seed would overwrite production player data.\n\n" +
      "Options:\n" +
      "  1. Run a local MongoDB (mongodb://localhost:27017/lineup-legends-e2e)\n" +
      "  2. Set MONGODB_URI to a dedicated test database\n" +
      "  3. Set E2E_ALLOW_REMOTE_DB=1 if you are certain this is a test cluster\n",
  );
  process.exit(1);
}

// ── Schemas (standalone — avoids importing app code that needs full env) ──

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  password: { type: String },
  username: { type: String },
  email: { type: String, required: true, unique: true },
  emailVerified: { type: Date, default: null },
  image: { type: String, default: null },
  bio: { type: String, default: null },
  profileImg: { type: String, default: null },
  bannerImg: { type: String, default: null },
  followerCount: { type: Number, default: 0 },
  followingCount: { type: Number, default: 0 },
  admin: { type: Boolean, default: false },
  mfaEnabled: { type: Boolean, default: false },
  mfaMethods: { type: [String], default: [] },
});

const PlayerSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  imgUrl: { type: String, required: true },
  value: { type: Number, required: true, min: 1, max: 5 },
  wikiPageTitle: { type: String, default: null },
  wikiSummaryExtract: { type: String, default: null },
  wikiThumbnailUrl: { type: String, default: null },
  wikiSummaryFetchedAt: { type: Date, default: null },
  wikiAwardsHonorsText: { type: String, default: null },
  wikiCareerRegularSeason: { type: mongoose.Schema.Types.Mixed, default: null },
  wikiCareerSeasonBests: { type: mongoose.Schema.Types.Mixed, default: null },
  wikiListedHeight: { type: String, default: null },
  wikiListedWeight: { type: String, default: null },
});

const User = mongoose.models.User ?? mongoose.model("User", UserSchema);
const Player = mongoose.models.Player ?? mongoose.model("Player", PlayerSchema);

// ── Test user ──

const TEST_USER = {
  email: "e2e-test@lineuplegends.dev",
  name: "E2E Test User",
  username: "e2e_tester",
};

const TEST_PASSWORD = "TestPassword123!";

// ── Extra user for "search for cassius" tests ──

const CASSIUS_USER = {
  email: "cassius@e2e-test.dev",
  name: "Cassius Reynolds",
  username: "cassius",
  bio: "E2E seed user for search tests",
  followerCount: 42,
  followingCount: 10,
};

// ── Players — synthetic names that cannot collide with real production data ──
// Previous versions used real NBA player names (Curry, Durant, etc.) which
// overwrote production documents when the seed ran against the live DB.

const E2E_IMG =
  "https://cdn.nba.com/headshots/nba/latest/1040x760/fallback.png";

const E2E_PLAYER_PREFIX = "E2EPlayer";

const PLAYERS = [
  {
    firstName: E2E_PLAYER_PREFIX,
    lastName: "Curry",
    imgUrl: E2E_IMG,
    value: 5,
    wikiPageTitle: "Stephen Curry",
    wikiSummaryExtract:
      "Wardell Stephen Curry II is an American professional basketball player. Widely regarded as the greatest shooter in NBA history, Curry has revolutionized the sport. He is a four-time NBA champion, a two-time NBA Most Valuable Player, and an NBA Finals MVP.",
    wikiSummaryFetchedAt: new Date(),
    wikiAwardsHonorsText:
      "4× NBA champion\n2× NBA MVP\nNBA Finals MVP\n10× NBA All-Star",
    wikiCareerRegularSeason: {
      GP: "956",
      GS: "944",
      MPG: "34.3",
      FG: ".473",
      "3P": ".425",
      FT: ".911",
      RPG: "4.7",
      APG: "6.4",
      SPG: "1.6",
      BPG: "0.2",
      PPG: "24.8",
    },
    wikiCareerSeasonBests: {
      PPG: { value: "32.0", season: "2020–21" },
      APG: { value: "8.5", season: "2014–15" },
      RPG: { value: "5.6", season: "2015–16" },
      SPG: { value: "2.1", season: "2014–15" },
      "3P": { value: ".454", season: "2015–16" },
    },
    wikiListedHeight: "6 ft 2 in (1.88 m)",
    wikiListedWeight: "185 lb (84 kg)",
  },
  {
    firstName: E2E_PLAYER_PREFIX,
    lastName: "Diamond",
    imgUrl: E2E_IMG,
    value: 5,
  },
  {
    firstName: E2E_PLAYER_PREFIX,
    lastName: "Amethyst",
    imgUrl: E2E_IMG,
    value: 4,
  },
  {
    firstName: E2E_PLAYER_PREFIX,
    lastName: "GoldTier",
    imgUrl: E2E_IMG,
    value: 3,
  },
  {
    firstName: E2E_PLAYER_PREFIX,
    lastName: "Silver",
    imgUrl: E2E_IMG,
    value: 2,
  },
  {
    firstName: E2E_PLAYER_PREFIX,
    lastName: "Bronze",
    imgUrl: E2E_IMG,
    value: 1,
  },
];

// ── Seed logic ──

async function seedTestUser() {
  const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 12);

  const user = (await User.findOneAndUpdate(
    { email: TEST_USER.email },
    {
      $set: { ...TEST_USER, password: hashedPassword, admin: false },
      $setOnInsert: { followerCount: 0, followingCount: 0 },
    },
    { upsert: true, new: true, lean: true },
  )) as { _id: mongoose.Types.ObjectId } | null;

  console.log(`E2E test user ready: ${user?._id} (${TEST_USER.email})`);
}

async function seedCassiusUser() {
  await User.findOneAndUpdate(
    { email: CASSIUS_USER.email },
    { $set: CASSIUS_USER, $setOnInsert: { admin: false } },
    { upsert: true },
  );
  console.log(`E2E cassius user ready (${CASSIUS_USER.email})`);
}

async function seedPlayers() {
  for (const player of PLAYERS) {
    await Player.findOneAndUpdate(
      { firstName: player.firstName, lastName: player.lastName },
      { $set: player },
      { upsert: true },
    );
  }
  console.log(
    `E2E players seeded: ${PLAYERS.length} synthetic players across tiers $1–$5`,
  );
}

async function seed() {
  await mongoose.connect(MONGODB_URI!);
  await seedTestUser();
  await seedCassiusUser();
  await seedPlayers();
  await mongoose.disconnect();
}

export async function teardown() {
  await mongoose.connect(MONGODB_URI!);

  await User.deleteMany({
    email: { $in: [TEST_USER.email, CASSIUS_USER.email] },
  });
  await Player.deleteMany({ firstName: E2E_PLAYER_PREFIX });

  console.log("E2E teardown: removed seed users and players");
  await mongoose.disconnect();
}

export default async function globalSetup() {
  await seed();
}

if (process.argv[1]?.endsWith("seed-test-user.ts")) {
  seed()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
