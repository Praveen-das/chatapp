import { EachMessagePayload } from "kafkajs";
import { consumer } from "../kafka/kafka";
import messageController from "./messageController";
import conversationController from "./conversationController";
import userController from "./userController";
import groupController from "./groupController";

const kafkaMessageController = async ({
  topic,
  partition,
  message: _message,
  heartbeat,
  pause,
}: EachMessagePayload) => {
  const message = _message.value?.toString();
  const RESET_TIMEOUT = 60 * 1000;

  function resetConsumer() {
    pause();
    setTimeout(() => {
      consumer.resume([{ topic }]);
    }, RESET_TIMEOUT);
  }

  const callback = () => resetConsumer();

  if (!message) return;

  switch (topic) {
    case "MESSAGES":
      messageController._saveUserMessage(message, callback);
      break;
    case "UPDATE_MESSAGES":
      messageController._updateUserMessages(message, callback);
      break;
    case "DELETE_MESSAGE_FOR_USER":
      messageController._deleteMessagesForUser(message, callback);
      break;

    case "CLEAR_CONVERSATION_FOR_USER":
      conversationController._clearConversation(message, callback);
      break;
    case "CLEAR_GROUP_CONVERSATION_FOR_USER":
      groupController._clearGroupConversation(message, callback);
      break;
    case "UPDATE_USER":
      userController._updateUserFromKafka(message, callback);
      break;
    default:
      break;
  }
};

export default kafkaMessageController;
