import { Kafka } from "kafkajs";

const kafka = new Kafka({
    clientId: "chat-application",
    brokers: ["192.168.1.5:9092"],
});

async function init() {
    const admin = kafka.admin();
    console.log("Admin connecting...");

    try {
        await admin.connect();
        console.log("Admin Connection Success...");

        await admin.createTopics({
            topics: [
                {
                    topic: "MESSAGES",
                },
                {
                    topic: "UPDATE_MESSAGES",
                },
                {
                    topic: "DELETE_MESSAGE_FOR_USER",
                },
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

// init();