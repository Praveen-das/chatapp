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
    case "CREATE_CONVERSATION":
      conversationController._createConversation(message, callback);
      break;
      
    // case "CREATE_GROUP":
    //   groupController._createGroup(message, callback);
    //   break;
    case "JOIN_GROUP":
      groupController._addMembersToGroup(message, callback);
      break;
    case "LEAVE_GROUP":
      groupController._removeMemberFromGroup(message, callback);
      break;
    case "UPDATE_GROUP_INFO":
      groupController._updateGroup(message, callback);
    case "CLEAR_GROUP_CONVERSATION_FOR_USER":
      groupController._clearGroupConversation(message, callback);
      break;
    case "ADD_GROUP_TAG":
      groupController._addTag(message, callback);
      break;
    case "REMOVE_GROUP_TAG":
      groupController._removeTag(message, callback);
      break;
    case "ADD_GROUP_ADMIN":
      groupController._makeUserAdmin(message, callback);
      break;
    case "REMOVE_GROUP_ADMIN":
      groupController._removeUserAdmin(message, callback);
      break;

    case "DELETE_GROUP_CONVERSATION":
      conversationController._deleteGroupConversation(message, callback);
      break;
    case "REMOVE_MEMBER":
      conversationController._deleteGroupConversation(message, callback);
      break;
    case "CREATE_USER_CONVERSATION":
      conversationController._createUserConversation(message, callback);
      break;
    case "CREATE_GROUP_CONVERSATION":
      conversationController._createGroupConversation(message, callback);
      break;
      break;
    case "UPDATE_MESSAGES":
      messageController._updateUserMessages(message, callback);
      break;
    case "DELETE_MESSAGE_FOR_USER":
      messageController._deleteMessagesForUser(message, callback);
      break;

    case "UPDATE_USER_CONVERSATION":
      conversationController._updateUserConversationById(message, callback);
      break;
    case "UPDATE_GROUP_CONVERSATION":
      conversationController._updateGroupConversationById(message, callback);
      break;
    case "UPDATE_USER_BLOCK_STATUS":
      conversationController._updateUserConversationBlockStatus(
        message,
        callback
      );
      break;
    case "REGISTER_STARRED_MESSAGES":
      conversationController._registerStarredMessages(message, callback);
      break;
    case "UNREGISTER_STARRED_MESSAGES":
      conversationController._unregisterStarredMessages(message, callback);
      break;

    case "UPDATE_USER":
      userController._updateUserFromKafka(message, callback);
      break;

    default:
      break;
  }
};

export default kafkaMessageController;
