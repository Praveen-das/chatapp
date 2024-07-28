import { EachMessagePayload } from "kafkajs";
import { deleteMessageForUser, saveUserMessage, updateUserMessages } from "../services/messageServices";
import { consumer } from "../kafka/kafka";
import conversationServices from "../services/conversationServices";
import userServices from "../services/userServices";

const kafkaMessageController = async ({ topic, partition, message: _message, heartbeat, pause }: EachMessagePayload) => {
    const message = _message.value?.toString()
    const RESET_TIMEOUT = 60 * 1000

    if (!message) return

    if (topic === "MESSAGES") {
        try {
            const { messages, conversation } = JSON.parse(message)
            
            if (conversation)
                await conversationServices.createConversation(conversation)
            await saveUserMessage(messages)
        } catch (error) {
            console.log("db error--->", error);
            pause();
            setTimeout(() => {
                consumer.resume([{ topic: "MESSAGES" }]);
            }, RESET_TIMEOUT);
        }
    }

    if (topic === "UPDATE_MESSAGES") {
        try {
            const { messages } = JSON.parse(message)
            await updateUserMessages(messages)
        } catch (error) {
            console.log("db error--->", error);
            pause();
            setTimeout(() => {
                consumer.resume([{ topic: "UPDATE_MESSAGES" }]);
            }, RESET_TIMEOUT);
        }
    }

    if (topic === "DELETE_MESSAGE_FOR_USER") {
        try {
            const { messages } = JSON.parse(message)

            await deleteMessageForUser(messages)
        } catch (error) {
            console.log("db error--->", error);
            pause();
            setTimeout(() => {
                consumer.resume([{ topic: "DELETE_MESSAGE_FOR_USER" }]);
            }, RESET_TIMEOUT);
        }
    }

    if (topic === 'UPDATE_USER') {
        try {
            const res = JSON.parse(message)

            let { id, updates } = res

            userServices.updateUser(id, updates)
            // await deleteMessageForUser(messages)
        } catch (error) {
            console.log("db error--->", error);
            pause();
            setTimeout(() => {
                consumer.resume([{ topic: "UPDATE_USER" }]);
            }, RESET_TIMEOUT);
        }
    }

}

export default kafkaMessageController