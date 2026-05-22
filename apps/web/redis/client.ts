import Redis from "ioredis";

const redisConfig = {
  host: process.env.NEXT_PUBLIC_REDIS_HOST,
  port: process.env.NEXT_PUBLIC_REDIS_PORT
    ? parseInt(process.env.NEXT_PUBLIC_REDIS_PORT)
    : 6379,
  username: process.env.NEXT_PUBLIC_REDIS_USERNAME,
  password: process.env.NEXT_PUBLIC_REDIS_PASSWORD,
};

const client = new Redis(redisConfig);

client.on("error", (err) => {
  console.log("Redis client Error", err);
  client.disconnect();
  console.log("Client disconnected");
});

// Create separate publisher and subscriber instances for resumable-stream
export const publisher = client;
export const subscriber = client.duplicate();

publisher.on("error", (err) => {
  console.log("Redis publisher Error", err);
});

subscriber.on("error", (err) => {
  console.log("Redis subscriber Error", err);
});

export default client;
