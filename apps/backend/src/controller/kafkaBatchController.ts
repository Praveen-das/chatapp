import { Consumer, EachBatchPayload } from "kafkajs";
import messageController from "./messageController";
import { IMessage } from "../interfaces/messageInterface";

interface IReq {
  messages: IMessage[];
}

const createKafkaBatchController =
  (consumer: Consumer) =>
  async ({
    batch,
    resolveOffset,
    heartbeat,
    isRunning,
    isStale,
    commitOffsetsIfNecessary,
    pause,
  }: EachBatchPayload) => {
    console.log("batch", batch.messages.length);

    const RESET_TIMEOUT = 60 * 1000;

    function resetConsumer() {
      pause();
      setTimeout(() => {
        consumer.resume([{ topic: "MESSAGES" }]);
      }, RESET_TIMEOUT);
    }

    const messagesToSave: IMessage[] = [];

    for (const message of batch.messages) {
      if (!isRunning() || isStale()) break;

      const messageContent = message.value?.toString();

      if (messageContent) {
        try {
          const { messages }: IReq = JSON.parse(messageContent);
          if (messages && Array.isArray(messages)) {
            messagesToSave.push(...messages);
          }
        } catch (e) {
          console.error("Error parsing message in batch", e);
        }
      }

      resolveOffset(message.offset);
      await heartbeat();
    }

    if (messagesToSave.length > 0) {
      await messageController._saveUserMessage(messagesToSave, resetConsumer);
    }

    await commitOffsetsIfNecessary();
  };

export default createKafkaBatchController;
