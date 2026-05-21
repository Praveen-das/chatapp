import Redis from "ioredis";

const client = new Redis(process.env.REDIS_SERVICE_URI!);

client.on("connect", () => {
  console.log("Connected to Redis");
});

client.on("error", (err) => {
  console.log("Redis session client Error", err);
  client.disconnect();
  console.log("Client disconnected");
});

export default client;
