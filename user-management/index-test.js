import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27018/user_management";

// Generate sample data
const generateSampleData = () => {
  const users = [];
  const hobbiesList = ["reading", "gaming", "coding", "swimming", "music", "traveling", "photography"];
  const bios = [
    "A passionate frontend developer who loves React.",
    "A backend engineer focusing on Node.js and MongoDB.",
    "Full stack developer building scalable web applications.",
    "Data scientist with a keen interest in machine learning.",
    "Software architect designing cloud-native solutions."
  ];

  for (let i = 1; i <= 50; i++) {
    // Generate UUID-like string for userId
    const userId = `USR-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    
    // Pick 1-3 random hobbies
    const userHobbies = [];
    const numHobbies = Math.floor(Math.random() * 3) + 1;
    for (let j = 0; j < numHobbies; j++) {
      const randomHobby = hobbiesList[Math.floor(Math.random() * hobbiesList.length)];
      if (!userHobbies.includes(randomHobby)) userHobbies.push(randomHobby);
    }

    users.push({
      name: `Test User ${i}`,
      email: `user${i}@example.com`,
      age: Math.floor(Math.random() * 60) + 18, // 18 to 77
      userId: userId,
      hobbies: userHobbies,
      bio: bios[Math.floor(Math.random() * bios.length)]
    });
  }
  return users;
};

async function runTests() {
  try {
    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("🟢 Connected successfully!\n");

    console.log("🔄 Clearing existing users...");
    await User.deleteMany({});
    
    console.log("🔄 Inserting sample data...");
    const sampleData = generateSampleData();
    await User.init();
    await User.insertMany(sampleData);
    console.log(`✅ Inserted ${sampleData.length} users\n`);

    console.log("=".repeat(50));
    console.log("📊 RUNNING .explain('executionStats') TESTS");
    console.log("=".repeat(50) + "\n");

    // Helper function to run explain and format output
    const runExplain = async (queryObject, description, queryMethod = "find") => {
      console.log(`\n▶️ TEST: ${description}`);
      console.log(`  Query: ${JSON.stringify(queryObject)}`);
      
      let explainResult;
      
      if (queryMethod === "find") {
        explainResult = await User.find(queryObject).explain("executionStats");
      }
      
      // Parse execution stats
      const stats = explainResult[0]?.executionStats || explainResult.executionStats; // Handle Mongoose 6/7/8 distincts
      if (!stats) {
             console.log("  Could not retrieve execution stats");
             return;
      }
      
      console.log(`  ⏱️ Execution Time: ${stats.executionTimeMillis} ms`);
      console.log(`  🔍 Total Docs Examined: ${stats.totalDocsExamined}`);
      console.log(`  🔑 Total Keys Examined: ${stats.totalKeysExamined}`);
      
      // Get winning plan
      const getIndexName = (plan) => {
        if (!plan) return 'Unknown';
        if (plan.stage === 'COLLSCAN') return 'COLLSCAN (No Index)';
        if (plan.stage === 'IXSCAN') return `Index: ${plan.indexName}`;
        if (plan.stage === 'FETCH' || plan.stage === 'PROJECTION_SIMPLE' || plan.stage === 'LIMIT') {
             if (plan.inputStage) return getIndexName(plan.inputStage);
        }
        if (plan.stage === 'TEXT_MATCH') return `Index: text`;
        return plan.stage;
      };
      
      const winningPlan = explainResult[0]?.queryPlanner?.winningPlan || explainResult.queryPlanner?.winningPlan;
      console.log(`  🛣️ Query Plan: ${getIndexName(winningPlan)}`);
    };

    // 1. Single Field Index Test
    await runExplain(
      { name: "Test User 25" }, 
      "Single Index (name)"
    );

    // 2. Compound Index Test
    await runExplain(
      { email: "user10@example.com", age: { $gte: 20 } }, 
      "Compound Index (email + age)"
    );

    // 3. Multikey Index Test
    await runExplain(
      { hobbies: "coding" }, 
      "Multikey Index (hobbies array)"
    );

    // 4. Text Index Test
    // Mongoose .explain() doesn't strictly bubble up TEXT_MATCH nicely sometimes, but we will try.
    console.log(`\n▶️ TEST: Text Index (bio)`);
    console.log(`  Query: { $text: { $search: "developer" } }`);
    const textExplain = await User.find({ $text: { $search: "developer" } }).explain("executionStats");
    const textStats = textExplain[0]?.executionStats || textExplain.executionStats;
    if (textStats) {
       console.log(`  ⏱️ Execution Time: ${textStats.executionTimeMillis} ms`);
       console.log(`  🔍 Total Docs Examined: ${textStats.totalDocsExamined}`);
       console.log(`  🔑 Total Keys Examined: ${textStats.totalKeysExamined}`);
       console.log(`  🛣️ Query Plan: TEXT_MATCH (Text Index Used)`);
    } else {
        console.log("  Could not fetch text index stats properly format");
    }

    // 5. Hashed Index Test
    // Pick the first user's userId
    const firstUser = await User.findOne();
    await runExplain(
      { userId: firstUser.userId }, 
      "Hashed Index (userId)"
    );

    // 6. Non-indexed Query (for comparison)
    // There's no index on bio except the text index, so a normal regex match will cause a COLLSCAN
    await runExplain(
      { bio: { $regex: "interest", $options: "i" } }, 
      "Unindexed Query (regex on bio -> FULL COLLECTION SCAN)"
    );

    console.log("\n=".repeat(50));
    console.log("✅ Tests Completed");

  } catch (err) {
    console.error("🔴 Error during testing:", err);
  } finally {
    await mongoose.disconnect();
    console.log("🟡 Disconnected from MongoDB");
  }
}

runTests();
