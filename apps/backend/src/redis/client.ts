import Redis from "ioredis";

if (!process.env.REDIS_HOST) throw Error("REDIS_HOST not found");
if (!process.env.REDIS_PORT) throw Error("REDIS_PORT not found");
if (!process.env.REDIS_USERNAME) throw Error("REDIS_USERNAME not found");
if (!process.env.REDIS_PASSWORD) throw Error("REDIS_PASSWORD not found");

export const connection = {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT),
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
  tls: { rejectUnauthorized: true },
  maxRetriesPerRequest: null,
  retryStrategy(times: number) {
    const delay = Math.min(times * 200, 5000);
    console.log(`Redis retry attempt ${times}, next in ${delay}ms`);
    return delay;
  },
};

const client = new Redis(connection);

client.on("connect", () => {
  console.log("Connected to Redis");
});

client
  .ping()
  .then((result) => {
    console.log("Redis is working:", result);
  })
  .catch((err) => {
    console.error("Failed to connect to Redis:", err);
  });

client.on("error", (err) => {
  console.log("Redis client Error", err);
  client.disconnect();
  console.log("Redis client disconnected");
});

export default client;
