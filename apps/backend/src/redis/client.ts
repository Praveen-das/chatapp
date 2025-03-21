import Redis from "ioredis";

const client = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
});

client.on("connect", () => {
  console.log("Connected to Redis");
});

client
  .ping()
  .then((result) => {
    console.log("Redis is working:", result); // Should log "PONG"
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
