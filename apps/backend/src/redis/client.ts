import Redis from "ioredis";

if(!process.env.REDIS_HOST) throw Error("REDIS_HOST not found")
if(!process.env.REDIS_PORT) throw Error("REDIS_PORT not found")
if(!process.env.REDIS_USERNAME) throw Error("REDIS_USERNAME not found")
if(!process.env.REDIS_PASSWORD) throw Error("REDIS_PASSWORD not found")

export const connection = {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT),
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
};

const client = new Redis("rediss://default:AVNS_D1LlsRwX88JbAGmseag@valkey-2a17d43d-viralapp.a.aivencloud.com:28908");

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
