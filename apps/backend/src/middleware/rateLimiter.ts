import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import RedisStore, { RedisReply } from "rate-limit-redis";
import Redis from "ioredis";
import { connection } from "../redis/client";

const redisClient = new Redis(connection);

export const aiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // Limit each IP/user to 5 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: async (command: string, ...args: string[]) => {
      // Use call method which returns raw Redis replies
      const result = await redisClient.call(command, ...args);
      return result as RedisReply;
    },
  }),
  keyGenerator: (req) => {
    // Use user ID if available, otherwise use IP with proper fallback
    const userId = (req as any).user?.id;
    if (userId) {
      return `user:${userId}`;
    }
    // For IP-based rate limiting, use the IP directly
    // express-rate-limit will handle IPv6 normalization internally
    return ipKeyGenerator(req.ip || "unknown");
  },
  handler: (req, res) => {
    res.status(429).json({
      error: "Too many requests. Please wait a moment before trying again.",
    });
  },
});
