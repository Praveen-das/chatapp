import { Server } from "socket.io";
import { ISocket } from "../interfaces/socketInterfaces";
import produceMessage from "../kafka/kafka";

export default function registerMessageHandlers(io: Server, socket: ISocket) {
    socket.on('message', async ({ messages, conversation }: { messages: IMessage[], conversation: IConversation }) => {
        const receiver = conversation.host === 'group' ?
            (conversation as IGroupConversation).channelId :
            conversation.members?.find(m => m.id !== socket.userId)?.id

        io.to(receiver!).emit('message receive', { messages, conversation });
        
        if (conversation.host === 'user')
            produceMessage({ messages, conversation });
        else
            produceMessage({ messages });
    });

    socket.on('change readReceipt', async (_updates: IUpdates) => {
        const updates = new Map(_updates)
        if (!updates.size) return;

        updates.forEach((values, { to, conversationId }) => {
            io.to(to).emit('change readReceipt', { conversationId, updates: values });
            produceMessage({ messages: values }, 'UPDATE_MESSAGES');
        })
    });

    socket.on('request:delete_message', async ({ to, conversationId, messages }: IDeleteRequest) => {
        if (!messages.length) return;

        io.to(socket.userId!).to(to).emit('request:delete_message', { conversationId, messages });
        produceMessage({ messages }, 'UPDATE_MESSAGES');
    });

    socket.on('request:delete_message_for_user', async ({ conversationId, messages }: IDeleteRequest) => {
        if (!messages.length) return;

        io.to(socket.userId!).emit('request:delete_message_for_user', { conversationId, messages });
        produceMessage({ messages }, 'DELETE_MESSAGE_FOR_USER');
    });
}
 