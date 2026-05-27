import {
  ConversationEntry,
  IdbReadReceiptRecord,
  IIdbConversastionRecord,
  IIdbUserRecord,
  IIdbUserRecordValue,
  RegisterValue,
  SaveConversationSyncState,
} from "@repo/interfaces/syncRegistryInterface";
import Redis from "ioredis";
import { Types } from "mongoose";
import { toString } from "../lib/helper";
import { z } from "zod";

import { MessageReadReceipt } from "@repo/interfaces/messageInterface";
import { readReceiptsSchema } from "../schemas/readReceiptSchema";

export default class SyncRegistryCreator {
  private redis: Redis;

  constructor(client: Redis) {
    this.redis = client;
  }

  disconnect() {
    this.redis.disconnect();
  }

  private getRegistryKey(userId: string | Types.ObjectId) {
    return `registry:${toString(userId)}`;
  }

  private getConvSyncKey(userConversationId: string | Types.ObjectId) {
    return `convSync:${toString(userConversationId)}`;
  }

  private getUserVersionKey(userId: string | Types.ObjectId) {
    return `userVersion:${toString(userId)}`;
  }

  private getReadReceiptEntryKey(conversationId: string | Types.ObjectId, userId: string | Types.ObjectId) {
    return `rrSync:${toString(conversationId)}:${toString(userId)}`;
  }

  async saveReadReceiptEntries(readReceipts: z.infer<typeof readReceiptsSchema>) {
    try {
      const pipeline = this.redis.pipeline();

      readReceipts.forEach((receipt) => {
        if (!receipt.userId) throw new Error("receipt userId undefined");
        if (!receipt.updatedAt) throw new Error("receipt updatedAt undefined");
        if (!receipt.conversationId) throw new Error("receipt conversationId undefined");
        if (!receipt.senderId) throw new Error("receipt senderId undefined");

        const key = this.getReadReceiptEntryKey(receipt.conversationId, receipt.senderId);

        pipeline.hset(key, toString(receipt.userId), receipt.updatedAt);
      });

      return await pipeline.exec();
    } catch (error) {
      console.error("Error saving read receipts:", error);
      return [];
    }
  }

  async getSyncReadReceiptEntries(userId: string, idbReadReceiptRecord: IdbReadReceiptRecord) {
    const pipeline = this.redis.pipeline();
    const result: { userId: Types.ObjectId; conversationId: Types.ObjectId; ids?: Types.ObjectId[] }[] = [];
    const idbReadReceiptEntries = Object.entries(idbReadReceiptRecord);

    idbReadReceiptEntries.forEach(([conversationId]) => {
      const key = this.getReadReceiptEntryKey(conversationId, userId);
      pipeline.hgetall(key);
    });

    const response = await pipeline.exec();

    idbReadReceiptEntries.forEach((idbReadReceiptEntry, idx) => {
      if (!response?.[idx]) return;

      const [err, redisResult] = response[idx];

      if (err) {
        console.error(`Error fetching read receipts for conversation ${idbReadReceiptEntry[0]}:`, err);
        return;
      }

      const ids: (string | null)[] = [];
      const [conversationId, idbReadReceipts] = idbReadReceiptEntry;
      let cachedReadReceipts = redisResult as Record<string, string>;

      try {
        if (cachedReadReceipts && Object.keys(cachedReadReceipts).length > 0) {
          // Create a map for faster lookup of client versions
          const idbReadReceiptMap = new Map<string, number>();
          idbReadReceipts.forEach((e) => idbReadReceiptMap.set(e.userId, e.updatedAt));

          Object.entries(cachedReadReceipts).forEach(([rUserId, rUpdatedAtStr]) => {
            const rUpdatedAt = Number(rUpdatedAtStr);
            const clientUpdatedAt = idbReadReceiptMap.get(rUserId);

            if (!clientUpdatedAt) return ids.push(null);

            if (rUpdatedAt && !isNaN(rUpdatedAt) && rUpdatedAt > clientUpdatedAt) {
              ids.push(rUserId);
            }
          });

          if (ids.every((id) => id === null)) return;

          result.push({
            conversationId: new Types.ObjectId(conversationId),
            userId: new Types.ObjectId(userId),
            ids: ids.length > 0 ? ids.filter((id) => id !== null).map((id) => new Types.ObjectId(id)) : undefined,
          });
        } else {
          result.push({
            conversationId: new Types.ObjectId(conversationId),
            userId: new Types.ObjectId(userId),
            ids: undefined,
          });
        }
      } catch (error) {
        console.error(`Skipping invalid ObjectId in sync read receipts for conversation ${conversationId}`);
      }
    });

    return result;
  }

  async deleteSyncReadReceiptEntries(conversationId: string, userId: string) {
    const key = this.getReadReceiptEntryKey(conversationId, userId);
    await this.redis.del(key);
  }

  async registerConversations(userId: string, userConversationIds: string[]) {
    if (!userConversationIds.length) return Promise.resolve();

    const key = this.getRegistryKey(userId);
    await this.redis.sadd(key, ...userConversationIds);
  }

  async getRegisteredConversations(userId: string): Promise<string[]> {
    const key = this.getRegistryKey(userId);
    return await this.redis.smembers(key);
  }

  async saveConversationSyncState(collection: SaveConversationSyncState[]) {
    if (!collection.length) return Promise.resolve();

    const pipeline = this.redis.pipeline();

    collection.forEach(({ conversationId, fieldValues }) => {
      const key = this.getConvSyncKey(conversationId);
      const updatedFields = [...fieldValues, "updatedAt", Date.now().toString()];
      pipeline.hset(key, ...updatedFields);
    });

    return await pipeline.exec();
  }

  async getUnsyncStateByToken({ userId, syncToken }: { userId: string; syncToken: number }) {
    const conversationSyncState: ConversationEntry[] = [];

    const userConversationData = await this.getUserConversationData(userId);

    if (!userConversationData) return null;

    userConversationData.forEach((data) => {
      let state: ConversationEntry = {};
      const messageTimestamp = Number(data.messageTimestamp) || 0;
      const updatedAt = Number((data as any).updatedAt) || 0;
      const createdAt = Number((data as any).createdAt) || 0;

      if (createdAt > syncToken) {
        state.newEntry = true;
      } else if (updatedAt > syncToken) {
        state.needSync = true;
      }

      if (messageTimestamp > syncToken) {
        state.lastKnownMessageTimestamp = syncToken;
      }

      if (Object.keys(state).length > 0) {
        state.conversationId = data.conversationId;
        state.host = data.host;
        conversationSyncState.push(state);
      }
    });

    return conversationSyncState;
  }

  async saveUserVersion(userId: string, version: number) {
    const userVersionKey = this.getUserVersionKey(userId);
    await this.redis.set(userVersionKey, version);
  }

  async saveConversationVersion(userConversationId: string, version: number) {
    const key = this.getConvSyncKey(userConversationId);
    return await this.redis.hset(key, ["version", version]);
  }

  async getUnsyncUsers(membersIds: IIdbUserRecordValue[]) {
    if (!membersIds.length) return [];

    const unsynced: string[] = [];
    const keys = membersIds.map((meta) => this.getUserVersionKey(meta.userId));
    const versions = await this.redis.mget(keys);

    if (!versions.length) return [];

    membersIds.forEach((meta, i) => {
      const localVersion = Number(meta.version);
      const remoteVersion = Number(versions[i]);

      if (!remoteVersion || Number.isNaN(remoteVersion)) return;
      if (remoteVersion > localVersion) {
        unsynced.push(meta.userId);
      }
    });

    return unsynced;
  }

  private async getUserConversationData(userId: string) {
    const registryKey = this.getRegistryKey(userId);
    const conversationIds = await this.redis.smembers(registryKey);

    if (!conversationIds.length) return null;

    const conversationSyncStatePipeline = this.redis.pipeline();

    conversationIds.forEach((ucid) => {
      let key = this.getConvSyncKey(ucid);
      conversationSyncStatePipeline.hgetall(key);
    });

    const conversationSyncState = await conversationSyncStatePipeline.exec().then((res) => {
      if (!res) return null;
      const data: RegisterValue[] = [];
      res.forEach((r, i) => {
        let value: any = r[1];
        if (value) data.push({ ...value, conversationId: conversationIds[i] });
      });
      return data;
    });

    return conversationSyncState;
  }

  // Get session info
  async getUnsyncState({ userId, idbConvRecord }: { userId: string; idbConvRecord: IIdbConversastionRecord }) {
    const conversationSyncState: ConversationEntry[] = [];

    const userConversationData = await this.getUserConversationData(userId);

    if (!userConversationData) return null;

    userConversationData.forEach((data, i) => {
      let idbEntry = idbConvRecord[data.conversationId!];

      if (!idbEntry)
        conversationSyncState.push({
          conversationId: data.conversationId,
          newEntry: true,
          host: data.host,
        });
      else {
        let state: ConversationEntry = {};
        let messageTimestamp = data.messageTimestamp;
        let lastKnownMessageTimestamp = Number(idbEntry.lastKnownMessageTimestamp);
        let version = data.version;
        let lastKnownVersion = Number(idbEntry.lastKnownVersion);

        if (version > lastKnownVersion) {
          state.needSync = true;
        }

        if (!Number.isNaN(messageTimestamp)) {
          if (!Number.isNaN(lastKnownMessageTimestamp) && messageTimestamp > lastKnownMessageTimestamp) {
            state.lastKnownMessageTimestamp = lastKnownMessageTimestamp;
          }
        }

        if (!!Object.keys(state).length) {
          state.conversationId = data.conversationId;
          state.host = data.host;
          conversationSyncState.push(state);
        }
      }
    });

    return conversationSyncState;
  }

  // async getConversationSyncState(entries: string[]) {
  //   const pipeline = this.redis.pipeline();

  //   entries.forEach((ucid) => {
  //     pipeline.get(this.getMessageSyncKey(ucid));
  //   });

  //   const results = await pipeline.exec();

  //   const data: Record<string, any> = {};

  //   Object.entries(entries).forEach(([id], i) => {
  //     const [, value] = results?.[i]!;
  //     if (!!value) data[id] = value;
  //   });

  //   return data;
  // }

  // Delete a session
  async deleteUnsyncState(sessionId: string) {
    const key = this.getConvSyncKey(sessionId);
    await this.redis.del(key);
  }
}
