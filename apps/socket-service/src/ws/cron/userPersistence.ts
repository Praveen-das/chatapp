import cron from "node-cron";
import client from "../../redis/client";
import { produceMessage, createEnvelope, KAFKA_TOPICS } from "../../kafka/kafka";

export const initUserPersistenceCron = () => {
  cron.schedule("5 * * * *", async () => {
    console.log("Running user persistence cron job...");
    const dirtyUsers = await client.smembers("dirty_users");

    if (dirtyUsers.length === 0) {
      console.log("No dirty users to sync.");
      return;
    }

    console.log(`Syncing ${dirtyUsers.length} users to DB...`);

    const body = [];

    for (const userId of dirtyUsers) {
      const [status, lastSeen] = await client.hmget(`user:${userId}`, "status", "lastSeen");

      if (!status) {
        // Handle case where user data might be missing in Redis but ID is in dirty set
        // Usually, we might want to remove it from dirty set or log it
        await client.srem("dirty_users", userId);
        continue;
      }

      body.push({
        id: userId,
        updates: { status, lastSeen: Number(lastSeen) },
      });
    }

    try {
      const result = await produceMessage(
        createEnvelope("BULK_UPDATE_USERS", body),
        KAFKA_TOPICS.USERS
      );
      const updatedUsers = body.map((user) => user.id);
      if (result) {
        await client.srem("dirty_users", updatedUsers);
      }
    } catch (error) {
      console.error(`BULK_UPDATE_USERS error:`, error);
    }
  });
};
