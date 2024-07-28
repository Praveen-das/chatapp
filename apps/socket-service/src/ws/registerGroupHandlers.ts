import { Server } from "socket.io";
import { ISocket } from "../interfaces/socketInterfaces";
import { createChatGroup } from "../services/groupServices";
import axiosClient from "../lib/axiosClient";

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

    socket.on('updateGroupInfo', async (req: { conversationId: string, updates: Partial<IGroupConversation> }) => {
        const body = { groupId: req.conversationId, updates: req.updates }
        const conversation = await fetch(`http://localhost:4000/group/update`,
            {
                method: 'PATCH',
                body: JSON.stringify(body),
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        )
        .then(res => res.json())
        .then(res => res[0])
        .catch(res => res)
        
        socket.emit('UPDATE_GROUP', conversation)
    })

    socket.on('GROUP_ADD_MEMBERS', async ({ conversationId, users }: { conversationId: string, users: string[] }) => {
        const body = { conversationId, users }

        const conversation: IGroupConversation = await fetch(`http://localhost:4000/group/add`,
            {
                method: 'POST',
                body: JSON.stringify(body),
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        )
            .then(res => res.json())
            .then(res => res[0])
            .catch(res => res)

        const sockets = io.sockets.sockets;

        users.forEach(id => {
            sockets.forEach((_socket: ISocket) => {
                if (_socket.userId === id)
                    _socket.join(conversation.channelId!);
            });
        })

        const members = (conversation.members as IUser[]).map(m => m.id)

        io.to(members).emit('GROUP_ADD_MEMBERS', conversation)

    })

    socket.on('GROUP_REMOVE_MEMBER', async ({ conversationId, userId }: { conversationId: string, userId: string }) => {
        const body = { conversationId, userId }

        const conversation: IGroupConversation = await axiosClient.patch(`/group/remove`, body)
            .then(res => res.data[0])
            .catch(res => res)

        const members = (conversation.members as IUser[]).map(m => m.id)

        const sockets = io.sockets.sockets;

        sockets.forEach((_socket: ISocket) => {
            if (_socket.userId === userId)
                _socket.leave(conversation.channelId!);
        });

        io.to(members).emit('UPDATE_GROUP', conversation)
    })

    socket.on('USER_MAKE_ADMIN', async ({ conversationId, userId }: { conversationId: string, userId: string }) => {
        const body = { conversationId, userId }

        const conversation: IGroupConversation = await axiosClient.patch(`/group/admins/add`, body)
            .then(res => res.data[0])
            .catch(res => res)

        const members = (conversation.members as IUser[]).map(m => m.id)

        io.to(members).emit('UPDATE_GROUP', conversation)
    })

    socket.on('USER_REMOVE_FROM_ADMIN', async ({ conversationId, userId }: { conversationId: string, userId: string }) => {
        const body = { conversationId, userId }

        const conversation: IGroupConversation = await axiosClient.patch(`/group/admins/remove`, body)
            .then(res => res.data[0])
            .catch(res => res)

        const members = (conversation.members as IUser[]).map(m => m.id)

        io.to(members).emit('UPDATE_GROUP', conversation)
    })
}
