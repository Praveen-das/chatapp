import Redis from "ioredis";

if (!process.env.NEXT_PUBLIC_REDIS_SERVICE_URI) {
  throw new Error("Please provide NEXT_PUBLIC_REDIS_SERVICE_URI in the environment variables");
}

const redisUri = process.env.NEXT_PUBLIC_REDIS_SERVICE_URI;

// Avoid creating multiple Redis instances during Next.js hot-reloads in development
const globalForRedis = globalThis as unknown as {
  redisClient: Redis | undefined;
  redisSubscriber: Redis | undefined;
};

const redisOptions = {
  maxRetriesPerRequest: null, // Allow ioredis to auto-reconnect without failing/throwing MaxRetriesPerRequestError
};

export const client = globalForRedis.redisClient ?? new Redis(redisUri, redisOptions);
export const publisher = client;
export const subscriber = globalForRedis.redisSubscriber ?? new Redis(redisUri, redisOptions);

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redisClient = client;
  globalForRedis.redisSubscriber = subscriber;
}

client.on("error", (err) => {
  console.error("Redis client Error:", err);
});

publisher.on("error", (err) => {
  console.error("Redis publisher Error:", err);
});

subscriber.on("error", (err) => {
  console.error("Redis subscriber Error:", err);
});

export default client;
