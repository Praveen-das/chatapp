import { Kafka, Producer } from "kafkajs";

const kafka = new Kafka({
    clientId: "chat-app",
    brokers: [`${process.env.KAFKA_HOST||process.env.KAFKA_LOCALHOST}:9092`],
});

let producer: null | Producer = null;

async function createProducer() {
    if (producer) return producer;

    const _producer = kafka.producer();
    await _producer.connect();
    producer = _producer;
    return producer;
}

async function produceMessage(body: any, topic:string) {
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