import Redis from "ioredis";

const client = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
});

client.on("connect", () => {
  console.log("Connected to Redis");
});

client.on("error", (err) => {
  console.log("Redis session client Error", err);
  client.disconnect();
  console.log("Client disconnected");
});

export default client;
