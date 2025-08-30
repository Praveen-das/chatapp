import { Kafka } from "kafkajs";
import kafkaMessageService from "../controller/kafkaMessageController";
import { topics } from "../config/kafkaTopics";

const kafka = new Kafka({
  clientId: "chat-application",
  brokers: [`${process.env.KAFKA_HOST || process.env.KAFKA_LOCALHOST}`],
  requestTimeout: 1000 * 60 * 5,
  connectionTimeout: 3000,
  retry: {
    retries: 100,
    initialRetryTime: 300, // initial delay between retries in milliseconds
    factor: 0.2, // factor to increase delay for each retry
  },
});

const consumer = kafka.consumer({ groupId: "default" });

async function initKafkaConsumer() {
  await consumer.connect();
  await consumer.subscribe({
    topics,
    fromBeginning: true,
  });
  await consumer.run({
    eachMessage: kafkaMessageService,
    autoCommit: true,
  });
}

consumer.on("consumer.connect", () => {
  console.log("Consumer connected");
});

consumer.on("consumer.disconnect", () => {
  console.log("Consumer disconnected");
});

consumer.on("consumer.network.request_timeout", () => {
  console.log("Consumer request timeout");
});

export { initKafkaConsumer, consumer, kafka };
