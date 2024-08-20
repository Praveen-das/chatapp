import { Server } from "socket.io";
import { ISocket } from "../interfaces/socketInterfaces";
import { createChatGroup } from "../services/groupServices";
import axiosClient from "../lib/axiosClient";

function getUpdatedValues(obj: IGroupConversation, key: string) {
    const value = { [key]: obj[key as keyof typeof obj] }
    return { id: obj.id, ...value }
}

export default function registerGroupHandlers(io: Server, socket: ISocket) {
    socket.on('create group', async ({ displayName, members }: IGroupCreationReq) => {
        if (!socket.userId) return;

        const conversation: IGroupConversation = {
            id: crypto.randomUUID(),
            channelId: crypto.randomUUID(),
            host: 'group',
            displayName,
            createdBy: socket.userId,
            members,
            admins: [socket.userId],
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        const sockets = io.sockets.sockets;

        const group = await createChatGroup(conversation);

        members.forEach(userId => {
            if (!userId) return;

            sockets.forEach((_socket: ISocket) => {
                if (_socket.userId === userId)
                    _socket.join(conversation.channelId!);
            });
        });

        io.to(conversation.channelId!).emit('group created', group);
    });

    socket.on('updateGroupInfo', async ({ conversation, updates }: { conversation: IGroupConversation, updates: Partial<IGroupConversation> }) => {
        const body = { groupId: conversation.id, updates: updates }
        const newConversation = await axiosClient.patch(`/group/update`, body)
            .then(res => res.data[0])
            .catch(res => res)

        const updatedProperty = Object.keys(updates)[0]
        
        const messageString =
            updatedProperty === 'displayName' ?
                `${socket.username} changed group name to "${updates.displayName}"` :
                `${socket.username} modified the group description`

        const message: Partial<IMessage> = {
            conversationId: conversation.id,
            from: 'system',
            message: messageString
        }

        const updatedConversation = getUpdatedValues(newConversation, updatedProperty)

        io.to(conversation.channelId!).emit('UPDATE_GROUP', updatedConversation, message)
    })

    socket.on('GROUP_JOIN', async ({ conversation, user }: { conversation: IGroupConversation, user: IUser }) => {
        const body = { conversationId: conversation.id, users: [user.id] }

        const _conversation = await axiosClient.post(`/group/add`, body)
            .then(res => res.data[0])
            .catch(res => res)

        socket.join(conversation.channelId!)

        const broadcastMessage: Partial<IMessage>[] = [{
            conversationId: conversation.id,
            from: 'system',
            message: `${user.username} joined the group`
        }]

        const userMessage: Partial<IMessage>[] = [{
            conversationId: conversation.id,
            from: 'system',
            message: `You joined the group`
        }]

        socket.emit('GROUP_ADD_MEMBERS', { conversation:_conversation, members: [user] }, userMessage)
        io.to(conversation.channelId!).except(user.id).emit('GROUP_ADD_MEMBERS', { conversation:_conversation, members: [user] }, broadcastMessage)
    })

    socket.on('GROUP_LEAVE', async ({ conversation, user }: { conversation: IGroupConversation, user: IUser }) => {
        const body = { conversationId: conversation.id, userId: user.id }

        await axiosClient.patch(`/group/remove`, body)
            .then(res => res.data[0])
            .catch(res => res)

        const message: Partial<IMessage>[] = [{
            conversationId: conversation.id,
            from: 'system',
            message: `${user.username} left the group`
        }]

        io.to(conversation.channelId!).emit('GROUP_REMOVE_MEMBER', { id: conversation.id, userId: user.id }, message)

        socket.leave(conversation.channelId!);
    })

    socket.on('GROUP_ADD_MEMBERS', async ({ conversation, users }: { conversation: IGroupConversation, users: string[] }) => {
        const body = { conversationId: conversation.id, users }

        const newConversation: IGroupConversation = await axiosClient.post(`/group/add`, body)
            .then(res => res.data[0])
            .catch(res => res)

        const sockets = io.sockets.sockets;

        users.forEach(id => {
            sockets.forEach((_socket: ISocket) => {
                if (_socket.userId === id) _socket.join(conversation.channelId!);
            });
        })

        const members = newConversation.members as IUser[]

        const newMembers = members.filter(m => users.includes(m.id))

        const messages = newMembers.map(m => ({
            conversationId: conversation.id,
            from: 'system',
            message: `${socket.username} added ${m.username}`
        }))

        const userMessages = newMembers.map(m => ({
            conversationId: conversation.id,
            from: 'system',
            message: `${socket.username} added you to the group`
        }))

        io.to(users).emit('GROUP_ADD_MEMBERS', { conversation, members: newMembers }, userMessages)
        io.to(conversation.channelId!).except(users).emit('GROUP_ADD_MEMBERS', { conversation, members: newMembers }, messages)
    })

    socket.on('GROUP_REMOVE_MEMBER', async ({ conversation, user }: { conversation: IGroupConversation, user: IUser }) => {
        const body = { conversationId: conversation.id, userId: user.id }

        await axiosClient.patch(`/group/remove`, body)
            .then(res => res.data[0])
            .catch(res => res)

        const sockets = io.sockets.sockets;

        sockets.forEach((_socket: ISocket) => {
            if (_socket.userId === user.id)
                _socket.leave(conversation.channelId!);
        });

        const message: Partial<IMessage>[] = [{
            conversationId: conversation.id,
            from: 'system',
            message: `${socket.username} removed ${user.username} from the group`
        }]

        io.to(conversation.channelId!).emit('GROUP_REMOVE_MEMBER', { id: conversation.id, userId: user.id }, message)
    })

    socket.on('USER_MAKE_ADMIN', async ({ conversationId, userId }: { conversationId: string, userId: string }) => {
        const body = { conversationId, userId }

        const conversation: IGroupConversation = await axiosClient.patch(`/group/admins/add`, body)
            .then(res => res.data[0])
            .catch(res => res)

        const updatedConversation = getUpdatedValues(conversation, 'admins')

        io.to(conversation.channelId!).emit('UPDATE_GROUP', updatedConversation)
    })

    socket.on('USER_REMOVE_FROM_ADMIN', async ({ conversationId, userId }: { conversationId: string, userId: string }) => {
        const body = { conversationId, userId }

        const conversation: IGroupConversation = await axiosClient.patch(`/group/admins/remove`, body)
            .then(res => res.data[0])
            .catch(res => res)

        const members = (conversation.members as IUser[]).map(m => m.id)

        const updatedConversation = getUpdatedValues(conversation, 'admins')

        io.to(members).emit('UPDATE_GROUP', updatedConversation)
    })
}
