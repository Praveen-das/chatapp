import sessionStore from "../session";
import { ISocket } from "../interfaces/socketInterfaces";
import { findUserMessages, findUserGroups, findUserConversations, getAllContacts } from "./userServices";

export const getConversations = async (socket: ISocket) => {
    if (!socket.userId) return;

    const [
        contacts,
        conversations,
        groups,
    ] = await Promise.all([
        getAllContacts(),
        findUserConversations(socket.userId),
        findUserGroups(socket.userId),
    ]);

    contacts.forEach((_user) => {
        _user.self = _user.id === socket.userId;
    })

    contacts.sort((a: any, b: any) => b.self - a.self)

    groups.forEach((group) => {
        socket.join(group.channelId!);
    });

    conversations.push(...groups as any)

    return { contacts, conversations };
};
