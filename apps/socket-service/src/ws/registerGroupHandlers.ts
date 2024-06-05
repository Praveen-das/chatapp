import { Server } from "socket.io";
import { ISocket } from "../interfaces/socketInterfaces";
import { createChatGroup } from "../services/groupServices";

export default function registerGroupHandlers(io: Server, socket: ISocket) {
    socket.on('create group', async ({ displayName, members }: IGroupConversation) => {
        if (!socket.username) return;

        if (!socket.userId) return;

        members.push(socket.userId);

        const conversation: IGroupConversation = {
            id: crypto.randomUUID(),
            channelId: crypto.randomUUID(),
            host: 'group',
            displayName,
            members,
            admins: [socket.userId],
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        const sockets = io.sockets.sockets;

        conversation.members.forEach(member => {
            if (!member) return;

            sockets.forEach((_socket: ISocket) => {
                if (_socket.userId === member)
                    _socket.join(conversation.channelId!);
            });
        });

        io.to(conversation.channelId!).emit('group created', conversation);
        createChatGroup(conversation);
    });
}
