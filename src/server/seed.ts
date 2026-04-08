import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Please define the MONGODB_URI environment variable");
  process.exit(1);
}

// Assert that MONGODB_URI is a string for TypeScript
const mongoUri: string = MONGODB_URI;

// Define Player schema inline for seeding (to avoid import issues)
const PlayerSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  imgUrl: { type: String, required: true },
  value: { type: Number, required: true, min: 1, max: 5 },
});

const Player = mongoose.models.Player ?? mongoose.model("Player", PlayerSchema);

// Basketball players data with values 1-5
// Value 5 = Superstars, Value 1 = Role players
const playersData = [
  // Value 5 Players (Superstars)
  {
    firstName: "LeBron",
    lastName: "James",
    value: 5,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/2544.png",
  },
  {
    firstName: "Kevin",
    lastName: "Durant",
    value: 5,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/201142.png",
  },
  {
    firstName: "Stephen",
    lastName: "Curry",
    value: 5,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/201939.png",
  },
  {
    firstName: "Giannis",
    lastName: "Antetokounmpo",
    value: 5,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/203507.png",
  },
  {
    firstName: "Nikola",
    lastName: "Jokic",
    value: 5,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/203999.png",
  },
  {
    firstName: "Luka",
    lastName: "Doncic",
    value: 5,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1629029.png",
  },
  {
    firstName: "Joel",
    lastName: "Embiid",
    value: 5,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/203954.png",
  },
  {
    firstName: "Jayson",
    lastName: "Tatum",
    value: 5,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1628369.png",
  },
  {
    firstName: "Kawhi",
    lastName: "Leonard",
    value: 5,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/202695.png",
  },
  {
    firstName: "Anthony",
    lastName: "Davis",
    value: 5,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/203076.png",
  },

  // Value 4 Players (All-Stars)
  {
    firstName: "Damian",
    lastName: "Lillard",
    value: 4,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/203081.png",
  },
  {
    firstName: "Jimmy",
    lastName: "Butler",
    value: 4,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/202710.png",
  },
  {
    firstName: "Trae",
    lastName: "Young",
    value: 4,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1629027.png",
  },
  {
    firstName: "Donovan",
    lastName: "Mitchell",
    value: 4,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1628378.png",
  },
  {
    firstName: "Kyrie",
    lastName: "Irving",
    value: 4,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/202681.png",
  },
  {
    firstName: "Ja",
    lastName: "Morant",
    value: 4,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1629630.png",
  },
  {
    firstName: "Paul",
    lastName: "George",
    value: 4,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/202331.png",
  },
  {
    firstName: "Jaylen",
    lastName: "Brown",
    value: 4,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1627759.png",
  },
  {
    firstName: "Zion",
    lastName: "Williamson",
    value: 4,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1629627.png",
  },
  {
    firstName: "Bam",
    lastName: "Adebayo",
    value: 4,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1628389.png",
  },
  {
    firstName: "De'Aaron",
    lastName: "Fox",
    value: 4,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1628368.png",
  },
  {
    firstName: "Anthony",
    lastName: "Edwards",
    value: 4,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1630162.png",
  },
  {
    firstName: "Shai",
    lastName: "Gilgeous-Alexander",
    value: 4,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1628983.png",
  },
  {
    firstName: "Devin",
    lastName: "Booker",
    value: 4,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1626164.png",
  },
  {
    firstName: "Karl-Anthony",
    lastName: "Towns",
    value: 4,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1626157.png",
  },

  // Value 3 Players (Quality Starters)
  {
    firstName: "Pascal",
    lastName: "Siakam",
    value: 3,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1627783.png",
  },
  {
    firstName: "Domantas",
    lastName: "Sabonis",
    value: 3,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1627734.png",
  },
  {
    firstName: "Jrue",
    lastName: "Holiday",
    value: 3,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/201950.png",
  },
  {
    firstName: "Khris",
    lastName: "Middleton",
    value: 3,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/203114.png",
  },
  {
    firstName: "Draymond",
    lastName: "Green",
    value: 3,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/203110.png",
  },
  {
    firstName: "Rudy",
    lastName: "Gobert",
    value: 3,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/203497.png",
  },
  {
    firstName: "Tyler",
    lastName: "Herro",
    value: 3,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1629639.png",
  },
  {
    firstName: "LaMelo",
    lastName: "Ball",
    value: 3,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1630163.png",
  },
  {
    firstName: "CJ",
    lastName: "McCollum",
    value: 3,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/203468.png",
  },
  {
    firstName: "Fred",
    lastName: "VanVleet",
    value: 3,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1627832.png",
  },
  {
    firstName: "Mikal",
    lastName: "Bridges",
    value: 3,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1628969.png",
  },
  {
    firstName: "Jarrett",
    lastName: "Allen",
    value: 3,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1628386.png",
  },
  {
    firstName: "Julius",
    lastName: "Randle",
    value: 3,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/203944.png",
  },
  {
    firstName: "D'Angelo",
    lastName: "Russell",
    value: 3,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1626156.png",
  },
  {
    firstName: "Jordan",
    lastName: "Poole",
    value: 3,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1629673.png",
  },
  {
    firstName: "Marcus",
    lastName: "Smart",
    value: 3,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/203935.png",
  },
  {
    firstName: "Desmond",
    lastName: "Bane",
    value: 3,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1630217.png",
  },
  {
    firstName: "Scottie",
    lastName: "Barnes",
    value: 3,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1630567.png",
  },
  {
    firstName: "Evan",
    lastName: "Mobley",
    value: 3,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1630596.png",
  },
  {
    firstName: "Jaren",
    lastName: "Jackson Jr.",
    value: 3,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1628991.png",
  },

  // Value 2 Players (Solid Contributors)
  {
    firstName: "OG",
    lastName: "Anunoby",
    value: 2,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1628384.png",
  },
  {
    firstName: "Robert",
    lastName: "Williams III",
    value: 2,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1629057.png",
  },
  {
    firstName: "Andrew",
    lastName: "Wiggins",
    value: 2,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/203952.png",
  },
  {
    firstName: "Tobias",
    lastName: "Harris",
    value: 2,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/202699.png",
  },
  {
    firstName: "John",
    lastName: "Collins",
    value: 2,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1628381.png",
  },
  {
    firstName: "Derrick",
    lastName: "White",
    value: 2,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1628401.png",
  },
  {
    firstName: "Kyle",
    lastName: "Kuzma",
    value: 2,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1628398.png",
  },
  {
    firstName: "Harrison",
    lastName: "Barnes",
    value: 2,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/203084.png",
  },
  {
    firstName: "Terry",
    lastName: "Rozier",
    value: 2,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1626179.png",
  },
  {
    firstName: "Brook",
    lastName: "Lopez",
    value: 2,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/201572.png",
  },
  {
    firstName: "Bogdan",
    lastName: "Bogdanovic",
    value: 2,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/203992.png",
  },
  {
    firstName: "Keldon",
    lastName: "Johnson",
    value: 2,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1629640.png",
  },
  {
    firstName: "Josh",
    lastName: "Hart",
    value: 2,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1628404.png",
  },
  {
    firstName: "Herbert",
    lastName: "Jones",
    value: 2,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1630529.png",
  },
  {
    firstName: "Austin",
    lastName: "Reaves",
    value: 2,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1630559.png",
  },
  {
    firstName: "Tyrese",
    lastName: "Maxey",
    value: 2,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1630178.png",
  },
  {
    firstName: "Franz",
    lastName: "Wagner",
    value: 2,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1630532.png",
  },
  {
    firstName: "Jalen",
    lastName: "Brunson",
    value: 2,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1628973.png",
  },
  {
    firstName: "Cade",
    lastName: "Cunningham",
    value: 2,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1630595.png",
  },
  {
    firstName: "Al",
    lastName: "Horford",
    value: 2,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/201143.png",
  },
  {
    firstName: "Malcolm",
    lastName: "Brogdon",
    value: 2,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1627763.png",
  },
  {
    firstName: "Jalen",
    lastName: "Green",
    value: 2,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1630224.png",
  },
  {
    firstName: "Ivica",
    lastName: "Zubac",
    value: 2,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1627826.png",
  },
  {
    firstName: "Buddy",
    lastName: "Hield",
    value: 2,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1627741.png",
  },
  {
    firstName: "Jonas",
    lastName: "Valanciunas",
    value: 2,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/202685.png",
  },

  // Value 1 Players (Role Players)
  {
    firstName: "Patty",
    lastName: "Mills",
    value: 1,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/201988.png",
  },
  {
    firstName: "Kevon",
    lastName: "Looney",
    value: 1,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1626172.png",
  },
  {
    firstName: "Nic",
    lastName: "Claxton",
    value: 1,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1629651.png",
  },
  {
    firstName: "Grant",
    lastName: "Williams",
    value: 1,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1629684.png",
  },
  {
    firstName: "Cam",
    lastName: "Johnson",
    value: 1,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1629661.png",
  },
  {
    firstName: "Max",
    lastName: "Strus",
    value: 1,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1629622.png",
  },
  {
    firstName: "Gary",
    lastName: "Trent Jr.",
    value: 1,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1629018.png",
  },
  {
    firstName: "Caleb",
    lastName: "Martin",
    value: 1,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1628997.png",
  },
  {
    firstName: "Precious",
    lastName: "Achiuwa",
    value: 1,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1630173.png",
  },
  {
    firstName: "Gabe",
    lastName: "Vincent",
    value: 1,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1629216.png",
  },
  {
    firstName: "P.J.",
    lastName: "Tucker",
    value: 1,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/200782.png",
  },
  {
    firstName: "Royce",
    lastName: "O'Neale",
    value: 1,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1626220.png",
  },
  {
    firstName: "Jae",
    lastName: "Crowder",
    value: 1,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/203109.png",
  },
  {
    firstName: "Bruce",
    lastName: "Brown",
    value: 1,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1628971.png",
  },
  {
    firstName: "Naz",
    lastName: "Reid",
    value: 1,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1629675.png",
  },
  {
    firstName: "Jose",
    lastName: "Alvarado",
    value: 1,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1630631.png",
  },
  {
    firstName: "Trey",
    lastName: "Murphy III",
    value: 1,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1630530.png",
  },
  {
    firstName: "Ayo",
    lastName: "Dosunmu",
    value: 1,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1630245.png",
  },
  {
    firstName: "Bones",
    lastName: "Hyland",
    value: 1,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1630538.png",
  },
  {
    firstName: "Davion",
    lastName: "Mitchell",
    value: 1,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1630558.png",
  },
  {
    firstName: "Immanuel",
    lastName: "Quickley",
    value: 1,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1630193.png",
  },
  {
    firstName: "Malik",
    lastName: "Monk",
    value: 1,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1628370.png",
  },
  {
    firstName: "Tre",
    lastName: "Jones",
    value: 1,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1630200.png",
  },
  {
    firstName: "Kevin",
    lastName: "Huerter",
    value: 1,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1628989.png",
  },
  {
    firstName: "Cam",
    lastName: "Reddish",
    value: 1,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1629629.png",
  },
  {
    firstName: "Delon",
    lastName: "Wright",
    value: 1,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1626153.png",
  },
  {
    firstName: "Cory",
    lastName: "Joseph",
    value: 1,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/202709.png",
  },
  {
    firstName: "Luke",
    lastName: "Kennard",
    value: 1,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1628379.png",
  },
  {
    firstName: "Shake",
    lastName: "Milton",
    value: 1,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1629003.png",
  },
  {
    firstName: "Oshae",
    lastName: "Brissett",
    value: 1,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1629052.png",
  },
];

async function main() {
  console.log("🏀 Connecting to MongoDB...");
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB!");

  console.log("🏀 Starting to seed players...");

  // Clear existing players
  await Player.deleteMany();
  console.log("Cleared existing players.");

  // Insert all players
  const result = await Player.insertMany(playersData);

  console.log(`✅ Successfully seeded ${result.length} players!`);

  // Log count by value
  for (let value = 1; value <= 5; value++) {
    const count = playersData.filter((p) => p.value === value).length;
    console.log(`   Value ${value}: ${count} players`);
  }
}

main()
  .then(async () => {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
    process.exit(0);
  })
  .catch(async (e) => {
    console.error(e);
    await mongoose.disconnect();
    process.exit(1);
  });
