import Redis from "ioredis";

const saveMessageRequestListener = async (subscriber: Redis) => {
  await subscriber.subscribe("save-message");

  subscriber.on("message", async (channel, message) => {
    if (channel !== "receive-messages") return;

    try {
      const payload = JSON.parse(message);
    } catch (err) {
      console.error("Failed to process redis message:", err);
    }
  });
};

export default saveMessageRequestListener;
