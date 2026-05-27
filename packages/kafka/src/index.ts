import { Kafka, Partitioners, type Producer } from "kafkajs";
import { KafkaEnvelope, KafkaTopic } from "./types";

import fs from "fs";
import path from "path";

export type { KafkaEnvelope, KafkaTopic } from "./types";
export { KAFKA_TOPICS, createEnvelope } from "./types";

const getSSLConfig = () => {
  // Option 1: Base64 strings from env (useful for serverless/containers)
  if (process.env.KAFKA_SSL_CA_B64 && process.env.KAFKA_SSL_KEY_B64 && process.env.KAFKA_SSL_CERT_B64) {
    return {
      ca: [Buffer.from(process.env.KAFKA_SSL_CA_B64, "base64").toString("utf-8").replace(/\r/g, "")],
      key: Buffer.from(process.env.KAFKA_SSL_KEY_B64, "base64").toString("utf-8").replace(/\r/g, ""),
      cert: Buffer.from(process.env.KAFKA_SSL_CERT_B64, "base64").toString("utf-8").replace(/\r/g, ""),
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
});


let producer: null | Producer = null;

export async function createProducer() {
  if (producer) return producer;

  const _producer = kafka.producer({
    allowAutoTopicCreation: false,
    idempotent: true,
    maxInFlightRequests: 1,
    retry: { retries: 5 },
    createPartitioner: Partitioners.LegacyPartitioner
  });
  await _producer.connect();
  producer = _producer;
  return producer;
}

export async function produceMessage(
  envelope: KafkaEnvelope,
  topic: KafkaTopic,
  partitionKey?: string
) {
  const producer = await createProducer();

  try {
    await producer.send({
      messages: [
        {
          key: partitionKey || `msg-${Date.now()}`,
          value: JSON.stringify(envelope),
        },
      ],
      topic,
      acks: -1,
    });
  } catch (err) {
    console.log("message producer error--->", err);
    return false;
  }

  return true;
}
