import { Kafka } from "kafkajs";
import kafkaMessageService from "../controller/kafkaMessageController";

const kafka = new Kafka({
    clientId: "chat-application",
    brokers: ["192.168.1.5:9092"],
    requestTimeout: 1000 * 60 * 5,
    connectionTimeout: 3000,
    retry: {
        retries: 100,
        initialRetryTime: 300, // initial delay between retries in milliseconds
        factor: 0.2, // factor to increase delay for each retry
    },
});

const consumer = kafka.consumer({ groupId: 'default' });

consumer.on('consumer.connect', () => {
    console.log('Consumer connected');
});

consumer.on('consumer.disconnect', () => {
    console.log('Consumer disconnected');
});

consumer.on('consumer.network.request_timeout', () => {
    console.log('Consumer request timeout');
});

async function initKafkaConsumer() {
    await consumer.connect();
    await consumer.subscribe({ topics: ["MESSAGES", "UPDATE_MESSAGES", "DELETE_MESSAGE_FOR_USER","UPDATE_USER"], fromBeginning: true });
    await consumer.run(
        {
            eachMessage: kafkaMessageService,
            autoCommit: true
        }
    );
}

export { initKafkaConsumer, consumer, kafka }