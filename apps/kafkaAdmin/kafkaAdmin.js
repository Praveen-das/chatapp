import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "chat-application",
  brokers: ["192.168.1.9:9092"],
});

async function init() {
  const admin = kafka.admin();
  console.log("Admin connecting...");

  try {
    await admin.connect();
    console.log("Admin Connection Success...");

    await admin.createTopics({
      topics: [
        { topic: "MESSAGES" },
        { topic: "UPDATE_MESSAGES" },
        { topic: "CREATE_CONVERSATION" },
        { topic: "CREATE_GROUP" },
        { topic: "LEAVE_GROUP" },
        { topic: "DELETE_GROUP_CONVERSATION" },
        { topic: "CREATE_USER_CONVERSATION" },
        { topic: "CREATE_GROUP_CONVERSATION" },
        { topic: "JOIN_GROUP" },
        { topic: "UPDATE_USER_CONVERSATION" },
        { topic: "UPDATE_GROUP_CONVERSATION" },
        { topic: "UPDATE_USER_BLOCK_STATUS" },
        { topic: "UPDATE_USER" },
        { topic: "DELETE_MESSAGE_FOR_USER" },
        { topic: "CLEAR_CONVERSATION_FOR_USER" },
        { topic: "CLEAR_GROUP_CONVERSATION_FOR_USER" },
        { topic: "REGISTER_STARRED_MESSAGES" },
        { topic: "UNREGISTER_STARRED_MESSAGES" },
        { topic: "ADD_GROUP_TAG" },
        { topic: "REMOVE_GROUP_TAG" },
        { topic: "UPDATE_GROUP_INFO" },
        { topic: "ADD_GROUP_ADMIN" },
        { topic: "REMOVE_GROUP_ADMIN" },
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
