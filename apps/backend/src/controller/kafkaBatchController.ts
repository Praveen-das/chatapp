import { Consumer, EachBatchPayload } from "kafkajs";
import { KafkaEnvelope } from "@repo/kafka";
import messageController from "./messageController";
import { IMessage } from "../interfaces/messageInterface";

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
        consumer.resume([{ topic: batch.topic }]);
      }, RESET_TIMEOUT);
    }

    const messagesToSave: IMessage[] = [];

    for (const message of batch.messages) {
      if (!isRunning() || isStale()) break;

      const raw = message.value?.toString();

      if (raw) {
        try {
          const envelope: KafkaEnvelope = JSON.parse(raw);

          if (envelope.action === "SAVE") {
            // Batch-save new messages
            const { messages } = envelope.payload as { messages: IMessage[] };
            if (messages && Array.isArray(messages)) {
              messagesToSave.push(...messages);
            }
          } else if (envelope.action === "UPDATE_MESSAGES") {
            // Per-message update within batch
            const payload = JSON.stringify(envelope.payload);
            await messageController._updateUserMessages(payload, resetConsumer);
          } else if (envelope.action === "DELETE_MESSAGE_FOR_USER") {
            // Per-message delete within batch
            const payload = JSON.stringify(envelope.payload);
            await messageController._deleteMessagesForUser(payload, resetConsumer);
          } else if (envelope.action === "SAVE_REENCRYPT_REQUEST") {
            const payload = JSON.stringify(envelope.payload);
            await messageController._savePendingReencryptRequest(payload, resetConsumer);
          } else if (envelope.action === "RESOLVE_REENCRYPT_REQUEST") {
            const payload = JSON.stringify(envelope.payload);
            await messageController._resolvePendingReencryptRequest(payload, resetConsumer);
          } else if (envelope.action === "SAVE_FAILED_REENCRYPTIONS") {
            const payload = JSON.stringify(envelope.payload);
            await messageController._saveFailedReencryptions(payload, resetConsumer);
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
