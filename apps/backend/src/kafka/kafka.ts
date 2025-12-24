import { Kafka } from "kafkajs";
import { topics } from "../config/kafkaTopics";
import createKafkaMessageController from "../controller/kafkaMessageController";
import createKafkaBatchController from "../controller/kafkaBatchController";

const kafka = new Kafka({
  clientId: "chat-app",
  brokers: [`${process.env.KAFKA_HOST || process.env.KAFKA_LOCALHOST}`],
  requestTimeout: 1000 * 60 * 5,
  connectionTimeout: 3000,
  retry: {
    retries: 10,
    initialRetryTime: 300, // initial delay between retries in milliseconds
    factor: 0.2, // factor to increase delay for each retry
  },
});

const messageConsumer = kafka.consumer({
  groupId: "chat-messages-batch-writer",
  maxWaitTimeInMs: 1500,
  minBytes: 64 * 1024,
});

const consumer = kafka.consumer({ groupId: "chat-db-writers", maxWaitTimeInMs: 1500, minBytes: 64 * 1024 });

async function initKafkaConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topics, fromBeginning: true });
  await consumer.run({
    autoCommit: true,
    eachMessage: createKafkaMessageController(consumer),
  });

  await messageConsumer.connect();
  await messageConsumer.subscribe({ topic: "MESSAGES", fromBeginning: true });
  await messageConsumer.run({
    autoCommit: true,
    eachBatchAutoResolve: true,
    eachBatch: createKafkaBatchController(messageConsumer),
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

export { initKafkaConsumer, consumer, messageConsumer, kafka };
