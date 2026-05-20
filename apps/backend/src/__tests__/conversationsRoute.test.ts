import "dotenv/config";
import test from "node:test";
import assert from "node:assert";
import express from "express";
import router from "../routes/conversationsRoute";
import { syncRegistry } from "../lib/SyncRegistry";
import userServices from "../services/userServices";
import conversationServices from "../services/conversationServices";
import MessageReadReceipt from "../models/MessageReadReceipt";
import * as groupServices from "../services/groupServices";

// Simple helper to launch a test server dynamically on an ephemeral port
function createTestServer() {
  const app = express();
  app.use(express.json());
  app.use("/db/conversation", router);
  return app;
}

test("conversationsRoute - POST /db/conversation/:userId Integration", async (t) => {
  const app = createTestServer();
  const server = app.listen(0);
  const port = (server.address() as any).port;
  const baseUrl = `http://localhost:${port}/db/conversation`;

  // Preserve original methods for cleanup
  const originalGetUnsyncStateByToken = syncRegistry.getUnsyncStateByToken;
  const originalGetRegisteredConversations = syncRegistry.getRegisteredConversations;
  const originalGetUsersFromConversations = userServices.getUsersFromConversations;
  const originalFetchConversations = conversationServices.fetchConversations;
  const originalGetUserConversation = conversationServices.getUserConversation;
  const originalFetchGroupsByUserId = groupServices.fetchGroupsByUserId;
  const originalFindReceipts = MessageReadReceipt.find;

  t.after(() => {
    // Restore original stubs and close server
    syncRegistry.getUnsyncStateByToken = originalGetUnsyncStateByToken;
    syncRegistry.getRegisteredConversations = originalGetRegisteredConversations;
    userServices.getUsersFromConversations = originalGetUsersFromConversations;
    conversationServices.fetchConversations = originalFetchConversations;
    conversationServices.getUserConversation = originalGetUserConversation;
    (groupServices as any).fetchGroupsByUserId = originalFetchGroupsByUserId;
    MessageReadReceipt.find = originalFindReceipts;
    syncRegistry.disconnect();
    server.close();
  });

  let currentSyncToken = 0;

  await t.test("Phase 1: Perform Initial Full Sync (syncToken = 0)", async () => {
    // Stub doFullSync dependencies:
    const mockUserConv = [{ conversationId: { toHexString: () => "65c36b8e2197e411b0e00f5a" }, version: 1, host: "user", createdAt: Date.now() }];
    conversationServices.getUserConversation = async () => mockUserConv as any;
    (groupServices as any).fetchGroupsByUserId = async () => [] as any;
    conversationServices.fetchConversations = async () => ({}) as any;
    userServices.getUsersFromConversations = async () => ({}) as any;

    // Stub syncRegistry storage calls
    syncRegistry.registerConversations = async () => {};
    syncRegistry.saveConversationSyncState = async () => [] as any;

    const response = await fetch(`${baseUrl}/65c36b8e2197e411b0e00f5c`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ syncToken: 0 }),
    });

    assert.strictEqual(response.status, 200);
    const data = await response.json();
    assert.ok(data.unsyncConversationsData);
    assert.deepStrictEqual(data.unsyncConversationsData.newEntry[0].host, "user");
    assert.ok(data.syncToken > 0);

    currentSyncToken = data.syncToken;
  });

  await t.test("Phase 2: Subsequent Idle Sync (Sends currentSyncToken with no updates)", async () => {
    // Stub getUnsyncStateByToken to return empty list (up-to-date)
    syncRegistry.getUnsyncStateByToken = async () => [];
    syncRegistry.getRegisteredConversations = async () => ["65c36b8e2197e411b0e00f5a"];
    userServices.getUsersFromConversations = async () => ({}) as any;
    MessageReadReceipt.find = (() => Promise.resolve([])) as any;

    const response = await fetch(`${baseUrl}/65c36b8e2197e411b0e00f5c`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ syncToken: currentSyncToken }),
    });

    assert.strictEqual(response.status, 200);
    const data = await response.json();
    assert.strictEqual(data.unsyncConversationsData, null);
    assert.strictEqual(data.unsyncUsersData, null);
    assert.strictEqual(data.unsyncReadReceipts, null);
    assert.ok(data.syncToken > currentSyncToken);

    currentSyncToken = data.syncToken;
  });

  await t.test("Phase 3: Real-Time Delta Catchup (Modified user profiles since token)", async () => {
    // Stub getUnsyncStateByToken to return empty list
    syncRegistry.getUnsyncStateByToken = async () => [];
    syncRegistry.getRegisteredConversations = async () => ["65c36b8e2197e411b0e00f5a"];

    // Stub userServices to return a user profile that has a newer updatedAt timestamp than the currentSyncToken
    userServices.getUsersFromConversations = async () => ({
      "other_user_id": { id: "other_user_id", username: "Other User", updatedAt: currentSyncToken + 5000 }
    }) as any;

    MessageReadReceipt.find = (() => Promise.resolve([])) as any;

    const response = await fetch(`${baseUrl}/65c36b8e2197e411b0e00f5c`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ syncToken: currentSyncToken }),
    });

    assert.strictEqual(response.status, 200);
    const data = await response.json();
    assert.strictEqual(data.unsyncConversationsData, null);
    assert.strictEqual(data.unsyncReadReceipts, null);
    assert.ok(data.unsyncUsersData);
    assert.deepStrictEqual(data.unsyncUsersData.other_user_id.username, "Other User");
    assert.ok(data.syncToken > currentSyncToken);
  });
});
