import { EachMessagePayload, Consumer } from "kafkajs";
import messageController from "./messageController";
import conversationController from "./conversationController";
import userController from "./userController";
import groupController from "./groupController";

const createKafkaMessageController =
  (consumer: Consumer) =>
  async ({ topic, partition, message: _message, heartbeat, pause }: EachMessagePayload) => {
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

    try {
      switch (topic) {
        case "CREATE_CONVERSATION":
          await conversationController._createConversation(message, callback);
          break;
        case "JOIN_GROUP":
          await groupController._addMembersToGroup(message, callback);
          break;
        case "LEAVE_GROUP":
          await groupController._removeMemberFromGroup(message, callback);
          break;
        case "UPDATE_GROUP_INFO":
          await groupController._updateGroup(message, callback);
          break;
        case "CLEAR_GROUP_CONVERSATION_FOR_USER":
          await groupController._clearGroupConversation(message, callback);
          break;
        case "ADD_GROUP_TAG":
          await groupController._addTag(message, callback);
          break;
        case "REMOVE_GROUP_TAG":
          await groupController._removeTag(message, callback);
          break;
        case "ADD_GROUP_ADMIN":
          await groupController._makeUserAdmin(message, callback);
          break;
        case "REMOVE_GROUP_ADMIN":
          await groupController._removeUserAdmin(message, callback);
          break;

        case "DELETE_GROUP_CONVERSATION":
          await conversationController._deleteGroupConversation(message, callback);
          break;
        // case "CREATE_USER_CONVERSATION":
        //   conversationController._createUserConversation(message, callback);
        //   break;
        // case "CREATE_GROUP":
        //   groupController._createGroup(message, callback);
        //   break;
        case "CREATE_GROUP_CONVERSATION":
          await conversationController._createGroupConversation(message, callback);
          break;

        case "UPDATE_MESSAGES":
          await messageController._updateUserMessages(message, callback);
          break;
        case "DELETE_MESSAGE_FOR_USER":
          await messageController._deleteMessagesForUser(message, callback);
          break;

        case "UPDATE_USER_CONVERSATION":
          await conversationController._updateUserConversationById(message, callback);
          break;
        case "UPDATE_GROUP_CONVERSATION":
          await conversationController._updateGroupConversationById(message, callback);
          break;
        case "CLEAR_GROUP_CONVERSATION":
          await conversationController._updateGroupConversationById(message, callback);
          break;
        case "UPDATE_USER_BLOCK_STATUS":
          await conversationController._updateUserConversationBlockStatus(message, callback);
          break;
        case "UPDATE_USER_RULE":
          await userController._updateUserRule(message, callback);
          break;
        case "REGISTER_STARRED_MESSAGES":
          await conversationController._registerStarredMessages(message, callback);
          break;
        case "UNREGISTER_STARRED_MESSAGES":
          await conversationController._unregisterStarredMessages(message, callback);
          break;
        case "UPDATE_READ_RECEIPTS":
          await conversationController._saveMessageReadReceipt(message, callback);
          break;

        case "UPDATE_USER":
          await userController._updateUserFromKafka(message, callback);
          break;
        case "BULK_UPDATE_USERS":
          await userController._bulkUpdateUsers(message, callback);
          break;

        case "END_SESSION":
          await userController._updateUserFromKafka(message, callback);
          break;

        default:
          break;
      }

      // ✅ Commit ONLY after DB success
      // await consumer.commitOffsets([
      //   {
      //     topic,
      //     partition,
      //     offset: (BigInt(message.offset) + 1n).toString(),
      //   },
      // ]);
    } catch (error) {
      console.log("error in kafka message controller", error);
    }
  };

export default createKafkaMessageController;
