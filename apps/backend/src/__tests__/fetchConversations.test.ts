import "dotenv/config";
import test from "node:test";
import assert from "node:assert";
import { Types } from "mongoose";
import conversationServices from "../services/conversationServices";
import Dummy from "../models/Dummy";
import { ConversationEntry } from "@repo/interfaces/syncRegistryInterface";

test("conversationServices - fetchConversations", async (t) => {
  const originalAggregate = Dummy.aggregate;

  t.after(() => {
    Dummy.aggregate = originalAggregate;
  });

  await t.test("should return empty array if conversationEntries is empty", async () => {
    const userId = new Types.ObjectId();
    const result = await conversationServices.fetchConversations(userId, []);
    assert.deepStrictEqual(result, []);
  });

  await t.test("should correctly categorize needSync, newEntry, and lastKnownMessageTimestamp", async () => {
    const userId = new Types.ObjectId();
    const convId1 = new Types.ObjectId().toHexString();
    const convId2 = new Types.ObjectId().toHexString();
    const convId3 = new Types.ObjectId().toHexString();

    const conversationEntries: ConversationEntry[] = [
      {
        conversationId: convId1,
        host: "user" as const,
        newEntry: true,
      },
      {
        conversationId: convId2,
        host: "user" as const,
        needSync: true,
      },
      {
        conversationId: convId3,
        host: "user" as const,
        lastKnownMessageTimestamp: 1500000000,
      },
    ];

    const capturedPipelines: any[] = [];
    (Dummy as any).aggregate = async (pipeline: any) => {
      capturedPipelines.push(pipeline);
      // Return a simulated document representing the processed conversation
      return [
        {
          id: pipeline[1].$unionWith.pipeline[0].$match.conversationId.toHexString(),
          host: "user",
        },
      ];
    };

    const result = (await conversationServices.fetchConversations(userId, conversationEntries)) as any;

    assert.ok(result);
    assert.ok(result.newEntry);
    assert.ok(result.needSync);
    assert.ok(result.messages);

    // Verify correct counts
    assert.strictEqual(result.newEntry.length, 1);
    assert.strictEqual(result.needSync.length, 1);
    assert.strictEqual(result.messages.length, 1);

    // Verify contents
    assert.strictEqual(result.newEntry[0].id, convId1);
    assert.strictEqual(result.needSync[0].id, convId2);
    assert.strictEqual(result.messages[0].id, convId3);
  });

  await t.test("should robustly handle keys in different order", async () => {
    const userId = new Types.ObjectId();
    const convId = new Types.ObjectId().toHexString();

    // Insertion order: conversationId is first, lastKnownMessageTimestamp is last, needSync is middle
    const entry = {} as any;
    entry.conversationId = convId;
    entry.host = "user";
    entry.needSync = true;
    entry.lastKnownMessageTimestamp = 1600000000;

    (Dummy as any).aggregate = async (pipeline: any) => {
      return [{ id: convId, host: "user" }];
    };

    const result = (await conversationServices.fetchConversations(userId, [entry])) as any;

    // Should classify as newEntry because needSync + lastKnownMessageTimestamp is present
    assert.ok(result);
    assert.ok(result.newEntry);
    assert.strictEqual(result.newEntry.length, 1);
    assert.strictEqual(result.newEntry[0].id, convId);
  });
});
