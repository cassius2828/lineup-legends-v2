import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI is required in .env");
  process.exit(1);
}

const TEST_USER = {
  email: "e2e-test@lineuplegends.dev",
  name: "E2E Test User",
  username: "e2e_tester",
};

const TEST_PASSWORD = "TestPassword123!";

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
});

const User = mongoose.models.User ?? mongoose.model("User", UserSchema);

async function seedTestUser() {
  await mongoose.connect(MONGODB_URI!);

  const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 12);

  const user = (await User.findOneAndUpdate(
    { email: TEST_USER.email },
    {
      $set: {
        ...TEST_USER,
        password: hashedPassword,
        admin: false,
      },
      $setOnInsert: {
        followerCount: 0,
        followingCount: 0,
      },
    },
    { upsert: true, new: true, lean: true },
  )) as { _id: mongoose.Types.ObjectId } | null;

  console.log(`E2E test user ready: ${user?._id} (${TEST_USER.email})`);

  await mongoose.disconnect();
}

export default async function globalSetup() {
  await seedTestUser();
}

if (process.argv[1]?.endsWith("seed-test-user.ts")) {
  seedTestUser()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
