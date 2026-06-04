import { Kafka } from "kafkajs";
import { topics, messageTopic } from "../config/kafkaTopics";
import createKafkaMessageController from "../controller/kafkaMessageController";
import createKafkaBatchController from "../controller/kafkaBatchController";
import fs from "fs";
import path from "path";

const getSSLConfig = () => {
  // Option 1: Base64 strings from env (useful for serverless/containers)
  if (process.env.KAFKA_SSL_CA_B64 && process.env.KAFKA_SSL_KEY_B64 && process.env.KAFKA_SSL_CERT_B64) {
    return {
      ca: [Buffer.from(process.env.KAFKA_SSL_CA_B64, "base64").toString("utf-8").replace(/\\n/g, "\n")],
      key: Buffer.from(process.env.KAFKA_SSL_KEY_B64, "base64").toString("utf-8").replace(/\\n/g, "\n"),
      cert: Buffer.from(process.env.KAFKA_SSL_CERT_B64, "base64").toString("utf-8").replace(/\\n/g, "\n"),
      rejectUnauthorized: true,
    };
  }

  // Option 2: Local file paths from env
  if (process.env.KAFKA_SSL_CA_PATH && process.env.KAFKA_SSL_KEY_PATH && process.env.KAFKA_SSL_CERT_PATH) {
    return {
      ca: [fs.readFileSync(path.resolve(process.env.KAFKA_SSL_CA_PATH), "utf-8")],
      key: fs.readFileSync(path.resolve(process.env.KAFKA_SSL_KEY_PATH), "utf-8"),
      cert: fs.readFileSync(path.resolve(process.env.KAFKA_SSL_CERT_PATH), "utf-8"),
      rejectUnauthorized: true,
    };
  }

  return undefined;
};

const broker = process.env.KAFKA_HOST || "localhost:9092";

const kafka = new Kafka({
  clientId: "chat-app",
  brokers: [broker],
  ssl: getSSLConfig(),
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
  await messageConsumer.subscribe({ topic: messageTopic, fromBeginning: true });
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

export { initKafkaConsumer };
