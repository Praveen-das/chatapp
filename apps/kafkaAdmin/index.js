import { Kafka } from "kafkajs";
import fs from "fs";
import path from "path";

const kafka = new Kafka({
  clientId: "chat-application",
  brokers: ["kafka-f6c1f2-viralapp.h.aivencloud.com:28909"],
  ssl: {
    rejectUnauthorized: false,
    ca: [fs.readFileSync(path.resolve("./certs/ca.pem")).toString("utf-8")],
    key: fs.readFileSync(path.resolve("./certs/service.key")).toString("utf-8"),
    cert: fs.readFileSync(path.resolve("./certs/service.cert")).toString("utf-8"),
  },
  // brokers: ["192.168.1.7:9092"],
});

async function init() {
  const admin = kafka.admin();
  console.log("Admin connecting...");

  try {
    await admin.connect();
    console.log("Admin Connection Success...");

    await admin.createTopics({
      topics: [
        { topic: "chat.messages", numPartitions: 3 },
        { topic: "chat.conversations", numPartitions: 3 },
        { topic: "chat.groups", numPartitions: 3 },
        { topic: "chat.users", numPartitions: 3 },
      ],
    });

    console.log("Topic Created Success");
  } catch (error) {
    console.log("Admin Connection Failed...");
    console.log("error-------->", error);
  }

  console.log("Disconnecting Admin..");
  await admin.disconnect();
}

init();
