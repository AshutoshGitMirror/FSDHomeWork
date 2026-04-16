import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27018/user_management";

const hobbiesList = ["reading", "gaming", "coding", "swimming", "music", "traveling", "photography", "cooking", "hiking", "painting"];
const bios = [
  "A passionate frontend developer who loves React.",
  "A backend engineer focusing on Node.js and MongoDB.",
  "Full stack developer building scalable web applications.",
  "Data scientist with a keen interest in machine learning.",
  "Software architect designing cloud-native solutions.",
  "Enthusiastic student exploring the world of programming.",
  "Cybersecurity analyst safeguarding digital assets.",
  "Mobile app developer crafting beautiful UI/UX."
];

const generate1000Users = () => {
  const users = [];
  for (let i = 1; i <= 1000; i++) {
    const userId = `USR-${Math.random().toString(36).substring(2, 9).toUpperCase()}-${i}`;
    
    const userHobbies = [];
    const numHobbies = Math.floor(Math.random() * 4) + 1; // 1 to 4 hobbies
    for (let j = 0; j < numHobbies; j++) {
      const randomHobby = hobbiesList[Math.floor(Math.random() * hobbiesList.length)];
      if (!userHobbies.includes(randomHobby)) userHobbies.push(randomHobby);
    }

    users.push({
      name: `Automated User ${i}`,
      email: `auto_user${i}_${Date.now()}@example.com`,
      age: Math.floor(Math.random() * 80) + 10,
      userId: userId,
      hobbies: userHobbies,
      bio: bios[Math.floor(Math.random() * bios.length)]
    });
  }
  return users;
};

async function seedDatabase() {
  try {
    console.log("🔄 Connecting to MongoDB at", MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log("🟢 Connected successfully!\n");
    
    // Ensure indexes are built
    await User.init();

    console.log("🔄 Generating 1000 users...");
    const sampleData = generate1000Users();
    
    console.log("🔄 Inserting data in bulk...");
    const result = await User.insertMany(sampleData);
    
    console.log(`✅ Successfully seeded ${result.length} users into the database!`);
    
    // Quick verify count
    const count = await User.countDocuments();
    console.log(`📊 Total users in collection now: ${count}`);

  } catch (err) {
    console.error("🔴 Error during seeding:", err);
  } finally {
    await mongoose.disconnect();
    console.log("🟡 Disconnected from MongoDB");
  }
}

seedDatabase();
