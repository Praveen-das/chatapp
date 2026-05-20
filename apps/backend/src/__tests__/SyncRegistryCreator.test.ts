import test from "node:test";
import assert from "node:assert";
import SyncRegistryCreator from "../redis/SyncRegistryCreator";
import Redis from "ioredis";

// Type-safe custom Mock Redis implementation for clean unit tests
class MockRedis {
  smembersMap = new Map<string, string[]>();
  pipelineData: any[] = [];

  async smembers(key: string): Promise<string[]> {
    return this.smembersMap.get(key) || [];
  }

  pipeline() {
    const self = this;
    return {
      hgetall(key: string) {
        return this;
      },
      async exec(): Promise<any[]> {
        return self.pipelineData;
      }
    };
  }
}

test("SyncRegistryCreator - getUnsyncStateByToken", async (t) => {
  await t.test("should return null if user conversation registry is empty", async () => {
    const mockRedis = new MockRedis();
    const syncRegistry = new SyncRegistryCreator(mockRedis as unknown as Redis);

    mockRedis.smembersMap.set("registry:user_123", []);

    const result = await syncRegistry.getUnsyncStateByToken({
      userId: "user_123",
      syncToken: 1000,
    });

    assert.strictEqual(result, null);
  });

  await t.test("should correctly classify needSync, newEntry, and messageTimestamp deltas", async () => {
    const mockRedis = new MockRedis();
    const syncRegistry = new SyncRegistryCreator(mockRedis as unknown as Redis);

    mockRedis.smembersMap.set("registry:user_123", ["conv_A", "conv_B"]);
    mockRedis.pipelineData = [
      [
        null,
        {
          conversationId: "conv_A",
          createdAt: "1200", // Created after syncToken (1000) -> newEntry
          updatedAt: "1300",
          messageTimestamp: "1300", // New messages
          host: "group",
        },
      ],
      [
        null,
        {
          conversationId: "conv_B",
          createdAt: "800", // Created before syncToken (1000)
          updatedAt: "1100", // Updated after syncToken -> needSync
          messageTimestamp: "900", // No new messages
          host: "user",
        },
      ],
    ];

    const result = await syncRegistry.getUnsyncStateByToken({
      userId: "user_123",
      syncToken: 1000,
    });

    assert.deepStrictEqual(result, [
      {
        conversationId: "conv_A",
        host: "group",
        newEntry: true,
        lastKnownMessageTimestamp: 1000,
      },
      {
        conversationId: "conv_B",
        host: "user",
        needSync: true,
      },
    ]);
  });
});
