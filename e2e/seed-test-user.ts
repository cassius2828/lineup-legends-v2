import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI is required in .env");
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

// ── Players — one per tier, Curry has full wiki data ──

const PLACEHOLDER_IMG =
  "https://cdn.nba.com/headshots/nba/latest/1040x760/201939.png";

const PLAYERS = [
  {
    firstName: "Stephen",
    lastName: "Curry",
    imgUrl: PLACEHOLDER_IMG,
    value: 5,
    wikiPageTitle: "Stephen Curry",
    wikiSummaryExtract:
      "Wardell Stephen Curry II (born March 14, 1988) is an American professional basketball player for the Golden State Warriors of the National Basketball Association (NBA). Widely regarded as the greatest shooter in NBA history, Curry has revolutionized the sport by inspiring teams and players to shoot three-pointers more frequently. He is a four-time NBA champion, a two-time NBA Most Valuable Player, and an NBA Finals MVP.",
    wikiSummaryFetchedAt: new Date(),
    wikiAwardsHonorsText:
      "4× NBA champion (2015, 2017, 2018, 2022)\n2× NBA Most Valuable Player (2015, 2016)\nNBA Finals MVP (2022)\n10× NBA All-Star (2014–2019, 2021–2024)\n4× All-NBA First Team (2015, 2016, 2021, 2024)\n2× NBA scoring champion (2016, 2021)\nNBA Three-Point Contest champion (2015)\nNBA Sportsmanship Award (2011)\nOlympic gold medalist (2024)",
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
    firstName: "Kevin",
    lastName: "Durant",
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/201142.png",
    value: 4,
  },
  {
    firstName: "Damian",
    lastName: "Lillard",
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/203081.png",
    value: 3,
  },
  {
    firstName: "Jaylen",
    lastName: "Brown",
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1627759.png",
    value: 2,
  },
  {
    firstName: "Tyler",
    lastName: "Herro",
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1629639.png",
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
    `E2E players seeded: ${PLAYERS.length} players across tiers $1–$5`,
  );
}

async function seed() {
  await mongoose.connect(MONGODB_URI!);
  await seedTestUser();
  await seedCassiusUser();
  await seedPlayers();
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
