import { Server } from "socket.io";
import { ISocket } from "../interfaces/socketInterfaces";
import produceMessage from "../kafka/kafka";

export default function registerMessageHandlers(io: Server, socket: ISocket) {
    socket.on('message', async ({ message, conversation }: { message: IMessage, conversation: IConversation }) => {
        io.to(message.to).emit('message receive', { message, conversation });

        if (conversation.host === 'user')
            produceMessage({ messages: [message], conversation });
        else
            produceMessage({ messages: [message] });
    });

    socket.on('forward message', ({ conversation, messages }: { conversation: IConversation; messages: IMessage[]; }) => {
        const to = conversation.members.find(m => m !== socket.userId)!
        const from = socket.userId!
        const readReceipt = conversation.members
            .filter(m => m !== socket.userId)
            .map(m => ({ userId: m, status: 0 }))

        const _messages = messages.map(message => {
            delete message._id;

            const newMessage = {
                ...message,
                id: crypto.randomUUID().toString(),
                conversationId: conversation.id,
                from, to,
                timestamp: Date.now(),
                readReceipt,
            };

            return newMessage;
        });

        io.to(socket.userId!).to(to).emit('forwarded message', { conversation, messages: _messages });
        produceMessage({ messages: _messages, conversation });
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
