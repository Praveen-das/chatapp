import "dotenv/config";
import mongoose, { Types } from "mongoose";
import initDatabase from "../db/mongoose.js";
import User from "../models/UserModal.js";
import Conversations from "../models/ConversationModel.js";
import UserConversation from "../models/UserConversation.js";
import conversationController from "../controller/conversationController.js";
import client from "../redis/client.js";

async function run() {
  console.log("Initializing database connection...");
  try {
    await initDatabase();
    console.log("Database connection established.");
  } catch (dbError) {
    console.error("Failed to connect to the database:", dbError);
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const command = args[0];

  try {
    if (!command) {
      console.log("\nUsage:");
      console.log("  pnpm --filter backend run script:create-conversations <userId | username>");
      console.log("  pnpm --filter backend run script:create-conversations --all-missing");
      console.log("  pnpm --filter backend run script:create-conversations --list");
      
      console.log("\nRecent 10 Users:");
      const recentUsers = await User.find().sort({ createdAt: -1 }).limit(10);
      if (recentUsers.length === 0) {
        console.log("  No users found in database.");
      } else {
        recentUsers.forEach(u => {
          console.log(`  - Username: ${u.username} | ID: ${u.id} | Phone: ${u.phoneNumber}`);
        });
      }
      return;
    }

    if (command === "--list") {
      console.log("\nAll Users in Database:");
      const allUsers = await User.find().sort({ username: 1 });
      if (allUsers.length === 0) {
        console.log("  No users found.");
      } else {
        allUsers.forEach(u => {
          console.log(`  - Username: ${u.username} | ID: ${u.id} | Phone: ${u.phoneNumber}`);
        });
      }
      return;
    }

    if (command === "--all-missing") {
      console.log("\nScanning database for users missing System or AI conversations...");
      const allUsers = await User.find();
      console.log(`Found ${allUsers.length} total users to scan.`);

      let processedCount = 0;
      let systemCreatedCount = 0;
      let aiCreatedCount = 0;

      for (const user of allUsers) {
        if (!user.id) continue;
        
        // Find existing conversations for this user
        const userConvs = await UserConversation.find({ userId: user.id });
        const conversationIds = userConvs.map(uc => uc.conversationId);
        const existingConvs = await Conversations.find({ id: { $in: conversationIds } });

        const hasSystem = existingConvs.some(c => c.host === "system");
        const hasAi = existingConvs.some(c => c.host === "ai");

        let systemCreated = false;
        let aiCreated = false;

        if (!hasSystem) {
          try {
            await conversationController.createSystemConversation(user.id);
            systemCreated = true;
            systemCreatedCount++;
          } catch (err) {
            console.error(`Failed to create system conversation for user ${user.username}:`, err);
          }
        }

        if (!hasAi) {
          try {
            await conversationController.createAiConversation(user.id);
            aiCreated = true;
            aiCreatedCount++;
          } catch (err) {
            console.error(`Failed to create AI conversation for user ${user.username}:`, err);
          }
        }

        if (systemCreated || aiCreated) {
          console.log(`User [${user.username} (${user.id})]:` + 
            (systemCreated ? " Created System Conversation." : "") + 
            (aiCreated ? " Created AI Conversation." : "")
          );
          processedCount++;
        }
      }

      console.log(`\nScan complete:`);
      console.log(`- Users processed: ${processedCount}`);
      console.log(`- System conversations created: ${systemCreatedCount}`);
      console.log(`- AI conversations created: ${aiCreatedCount}`);
      return;
    }

    // Otherwise, treat as a user ID or a username
    let user = null;
    if (Types.ObjectId.isValid(command)) {
      const targetUserId = new Types.ObjectId(command);
      user = await User.findOne({ id: targetUserId });
      if (!user) {
        // Fall back to username search in case the username happens to be a valid ObjectId string
        user = await User.findOne({ username: command });
      }
    } else {
      user = await User.findOne({ username: command });
    }

    if (!user) {
      console.error(`Error: User with ID or username "${command}" not found in database.`);
      return;
    }

    console.log(`\nFound User: ${user.username} (${user.id})`);
    
    // Find existing conversations
    const userConvs = await UserConversation.find({ userId: user.id });
    const conversationIds = userConvs.map(uc => uc.conversationId);
    const existingConvs = await Conversations.find({ id: { $in: conversationIds } });

    const hasSystem = existingConvs.some(c => c.host === "system");
    const hasAi = existingConvs.some(c => c.host === "ai");

    console.log(`Current state:`);
    console.log(`- System Conversation: ${hasSystem ? "Exists" : "Missing"}`);
    console.log(`- AI Conversation: ${hasAi ? "Exists" : "Missing"}`);

    if (!hasSystem) {
      console.log("Creating System Conversation...");
      await conversationController.createSystemConversation(user.id);
      console.log("System Conversation created successfully.");
    } else {
      console.log("System Conversation already exists.");
    }

    if (!hasAi) {
      console.log("Creating AI Conversation...");
      await conversationController.createAiConversation(user.id);
      console.log("AI Conversation created successfully.");
    } else {
      console.log("AI Conversation already exists.");
    }

  } catch (error) {
    console.error("An error occurred during execution:", error);
  } finally {
    console.log("Disconnecting from Redis...");
    client.disconnect();
    console.log("Disconnecting from MongoDB...");
    await mongoose.connection.close();
    console.log("Done.");
  }
}

run();
