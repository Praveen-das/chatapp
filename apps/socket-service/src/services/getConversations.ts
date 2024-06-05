import sessionStore from "../session";
import { ISocket } from "../interfaces/socketInterfaces";
import { findUserMessages, findUserGroups, findUserConversations } from "./userServices";

export const getConversations = async (socket: ISocket) => {
    if (!socket.userId) return;

    const [
        connectedUsers,
        conversations,
        groups,
    ] = await Promise.all([
        sessionStore.findAllSessions(),
        findUserConversations(socket.userId),
        findUserGroups(socket.userId),
    ]);

    connectedUsers.forEach((_user) => {
        _user.self = _user.socketId === socket.id;
    })

    groups.forEach((group) => {
        socket.join(group.channelId!);
    });

    conversations.push(...groups as any)

    return { connectedUsers, conversations };
};
