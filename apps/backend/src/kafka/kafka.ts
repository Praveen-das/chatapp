import { Kafka } from "kafkajs";
import kafkaMessageService from "../controller/kafkaMessageController";

const kafka = new Kafka({
    clientId: "chat-application",
    brokers: ["192.168.1.5:9092"],
});

const consumer = kafka.consumer({ groupId: 'default' });

async function initKafkaConsumer() {
    await consumer.connect();
    await consumer.subscribe({ topics: ["MESSAGES", "UPDATE_MESSAGES", "DELETE_MESSAGE_FOR_USER"], fromBeginning: true });
    await consumer.run(
        {
            eachMessage: kafkaMessageService,
            autoCommit: true
        }
    );
}

export { initKafkaConsumer, consumer, kafka }