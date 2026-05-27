import { Server } from "socket.io";
import { produceMessage, createEnvelope, KAFKA_TOPICS } from "../kafka/kafka";
import { ISocket } from "../interfaces/socketInterfaces";
import { IUserBlockRequest } from "@repo/interfaces/conversationInterface";
import { IUserRuleChangeRequest } from "@repo/interfaces/userInterface";
import client from "../redis/client";

export default async function registerUserHandlers(io: Server, socket: ISocket) {
  socket.on("USER_CONNECTED", async (to: string[], rules?: string[], blockedUsers?: string[]) => {
    try {
      await client.hset(`user:${socket.userId}`, "status", "online");
      await client.sadd(`active_sockets:${socket.userId}`, socket.id);
      if (rules) {
        await client.hset(`user:${socket.userId}`, "rules", JSON.stringify(rules));
      }
      await client.sadd("dirty_users", socket.userId!);

      if (blockedUsers && blockedUsers.length > 0) {
        await client.del(`block:${socket.userId}`);
        await client.sadd(`block:${socket.userId}`, ...blockedUsers);
      } else {
        await client.del(`block:${socket.userId}`);
      }
    } catch (e) {
      console.error(`USER_CONNECTED: Redis unavailable for ${socket.userId}`, e);
    }

    // Always broadcast even if Redis cache failed
    io.to(to).emit("USER_CONNECTED", { userId: socket.userId });
  });

  socket.on("UPDATE_USER_BLOCK_STATUS", async ({ conversationId, blocked, blockedId }: IUserBlockRequest) => {
    const req = {
      conversationId,
      blocked,
      blockedList: [{ userId: blockedId, blockedBy: socket.userId }],
      blockedId,
    };

    try {
      if (blocked) {
        await client.sadd(`block:${socket.userId}`, blockedId!);
      } else {
        await client.srem(`block:${socket.userId}`, blockedId!);
      }
    } catch (e) {
      console.error(`UPDATE_USER_BLOCK_STATUS: Redis unavailable for ${socket.userId}`, e);
    }

    io.to(blockedId!).emit("UPDATE_USER_BLOCK_STATUS", conversationId, {
      blockedByUser: blocked,
    });

    io.to(socket.userId!).emit("UPDATE_USER_BLOCK_STATUS", conversationId, {
      blocked,
    });

    produceMessage(
      createEnvelope("UPDATE_USER_BLOCK_STATUS", req),
      KAFKA_TOPICS.CONVERSATIONS,
      conversationId
    );
  });

  socket.on("UPDATE_USER", (req: IUserUpdateRequest) => {
    const body = {
      id: req.userId,
      updates: req.updates,
    };

    produceMessage(
      createEnvelope("UPDATE_USER", body),
      KAFKA_TOPICS.USERS,
      req.userId
    );
  });

  socket.on("UPDATE_USER_RULE", async (req: IUserRuleChangeRequest, sockets: string[]) => {
    try {
      const currentRulesJson = await client.hget(`user:${req.userId}`, "rules");
      let currentRules: string[] = currentRulesJson ? JSON.parse(currentRulesJson) : [];
      if (currentRules.includes(req.rule)) {
        currentRules = currentRules.filter((r) => r !== req.rule);
      } else {
        currentRules.push(req.rule);
      }
      await client.hset(`user:${req.userId}`, "rules", JSON.stringify(currentRules));
    } catch (e) {
      console.error("Failed to update user rule in Redis cache:", e);
    }

    sockets.forEach((id) => {
      io.to(id).emit("UPDATE_USER_RULE", req);
    });

    produceMessage(
      createEnvelope("UPDATE_USER_RULE", req),
      KAFKA_TOPICS.USERS
    );
  });

  socket.on("GET_USER_STATUS", async ({ userId }: { userId: string }, callback: (data: any) => void) => {
    const requesterId = socket.userId;
    const targetId = userId;

    let status: string | null = null;
    let lastSeen: string | null = null;
    let rulesJson: string | null = null;
    try {
      [status, lastSeen, rulesJson] = await client.hmget(`user:${targetId}`, "status", "lastSeen", "rules");
    } catch (e) {
      console.error(`GET_USER_STATUS: Redis unavailable for ${targetId}`, e);
      return callback(null);
    }
    if (!status) {
      return callback(null);
    }

    let rules: string[] = [];
    try {
      rules = rulesJson ? JSON.parse(rulesJson) : [];
    } catch {
      console.error(`Corrupt rules JSON for user ${targetId}, defaulting to []`);
    }
    const isOnline = status === "online";

    const pipeline = client.pipeline();
    pipeline.sismember(`block:${targetId}`, requesterId!);
    pipeline.sismember(`block:${requesterId}`, targetId);

    let hasBlocks = false;
    try {
      const results = await pipeline.exec();
      if (results) {
        const isBlockedByTarget = results[0][1] === 1;
        const isBlockedByUser = results[1][1] === 1;
        hasBlocks = isBlockedByTarget || isBlockedByUser;
      }
    } catch (e) {
      console.error("Failed to query block sets in Redis:", e);
    }

    if (hasBlocks) {
      return callback({ userId: targetId, status: "offline", lastSeen: null });
    }

    const shouldHideLastSeen = !isOnline && rules.includes("hide_lastseen");

    callback({
      userId: targetId,
      status,
      lastSeen: shouldHideLastSeen ? null : Number(lastSeen),
    });
  });
}
