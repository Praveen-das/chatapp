import client from "../redis/client";

export const pub = client;
export const sub = client.duplicate();

pub.on("error", (err) => {
  console.log("Redis pubClient Error", err);
  pub.disconnect();
  console.log("Client disconnected");
});

sub.on("error", (err) => {
  console.log("Redis subClient Error", err);
  sub.disconnect();
  console.log("Client disconnected");
});

process.on("SIGTERM", async () => {
  await sub.quit();
  process.exit(0);
});