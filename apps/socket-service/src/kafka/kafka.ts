import { Kafka, Producer } from "kafkajs";

const kafka = new Kafka({
    clientId: "chat-app",
    brokers: ["192.168.1.4:9092"],
});

let producer: null | Producer = null;

export async function createProducer() {
    if (producer) return producer;

    const _producer = kafka.producer();
    await _producer.connect();
    producer = _producer;
    return producer;
}

async function produceMessage(body: any, topic = "MESSAGES") {
    const producer = await createProducer();

    try {
        await producer.send({
            messages: [{ key: `message-${Date.now()}`, value: JSON.stringify(body) }],
            topic,
        });
    } catch (err) {
        console.log('message producer error--->>', err);
    }

    return true;
}

export default produceMessage