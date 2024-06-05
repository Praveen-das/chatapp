"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react"
import { useAuth } from "./AuthContext";
import socket from "../lib/ws";
import { useMessages } from "../store/messageStore";
import { IMessageReadReceipt } from "../enums/enums";
import { useStore } from "../store/global";
import _ from 'lodash'
import { upsert } from "../helpers/helpers";

const SocketContext = createContext<ISocketContext | null>(null)

declare global {
    interface Map<K, V> {
        upsert: (key: { conversationId: string, to: string }, value: IUpdatesCollection) => Map<K, V>
    }
}

Map.prototype.upsert = function (key, value) {
    this.has(key) ?
        this.get(key)?.push(value) :
        this.set(key, [value]);

    return this
}

export const useSocket = () => {
    const state = useContext(SocketContext)
    if (!state) throw new Error(`Context not found`)
    return state
}

export const SockerProvider: React.FC<SocketProviderProps> = ({ children }) => {
    const [users, setUsers] = useState<IUser[]>([])

    const [blockedUsers, setBlockedUsers] = useState<IUBlockReq[]>([])
    const [blockedByUsers, setBlockedByUsers] = useState<IUBlockReq[]>([])

    const { user } = useAuth()

    const setConversation = useMessages(s => s.setConversation)
    const setMessageStore = useMessages(s => s.setMessageStore)
    const setUnreadMessages = useMessages(s => s.setUnreadMessages)
    const updateUserMessages = useMessages(s => s.updateUserMessages)
    const deleteUserMessages = useMessages(s => s.deleteUserMessages)
    const updateReadReceipt = useMessages(s => s.updateReadReceipt)
    const setMessages = useMessages(s => s.setMessages)

    useEffect(() => {
        const sessionId = sessionStorage.getItem("sessionId")

        if (!user) return

        if (sessionId) {
            socket.auth = { sessionId };
        } else {
            socket.auth = { user }
        }

        socket.connect()

        return () => {
            socket.disconnect()
        }

    }, [user])

    useEffect(() => {
        socket.on('session', onSessionReceived)
        socket.on("conversations", onReceiveConnectedUsers);
        socket.on("user connected", onUserConnected);
        socket.on("user disconnected", onUserDisconnected);
        socket.on('message receive', onMessageReceive)
        socket.on('forwarded message', onForwardMessageReceive)
        socket.on('change readReceipt', onReadReceiptChangeRequest)
        socket.on('request:delete_message', res => handleMessageDelete(res, true))
        socket.on('request:delete_message_for_user', handleMessageDelete)
        socket.on('RESPONSE:BLOCK_USER', handleBlockingUser)
        socket.on('RESPONSE:UNBLOCK_USER', handleUnBlockingUser)
        socket.on('group created', (group: IGroupConversation) => {
            registerConversation(group)
        })

        return () => {
            socket.off('session', onSessionReceived)
            socket.off('conversations', onReceiveConnectedUsers)
            socket.off('user connected', onUserConnected)
            socket.off('user disconnected', onUserDisconnected)
            socket.off('message receive', onMessageReceive)
            socket.off('forwarded message', onForwardMessageReceive)
            socket.off('change readReceipt', onReadReceiptChangeRequest)
            socket.off('request:delete_message')
            socket.off('request:delete_message_for_user', handleMessageDelete)
            socket.off('RESPONSE:BLOCK_USER', handleBlockingUser)
            socket.off('RESPONSE:UNBLOCK_USER', handleUnBlockingUser)
            socket.off('group created')
        }
    }, [user, blockedUsers, blockedByUsers])

    // receivers///////////////////////////

    const onReceiveConnectedUsers = useCallback((
        {
            connectedUsers,
            blockedUsers,
            blockedByUsers,
            conversations,
        }: {
            connectedUsers: IUser[],
            blockedUsers: IUBlockReq[],
            blockedByUsers: IUBlockReq[],
            conversations: IIConversation[],
        }) => {
        registerConversations(conversations)
        setUsers(connectedUsers)
        setBlockedUsers(blockedUsers)
        setBlockedByUsers(blockedByUsers)
    }, [user])

    const onUserConnected = useCallback((connectedUser: IUser) => {
        setUsers(_u => {
            const _user = _u.filter(u => u.userId !== connectedUser.userId)
            return [..._user, connectedUser]
        })
    }, [])

    const onUserDisconnected = useCallback((user: IUser) => {
        setUsers((s: any) => s.map((u: IUser) => {
            if (u.userId === user.userId) return user
            return u
        }))
    }, [])

    function onMessageReceive({ message, conversation }: { message: IMessage, conversation: IIConversation }) {
        const conversationId = conversation.id!

        const updates: IUpdates = new Map()

        const currentUser = conversationId === socket.selectedConversation?.id

        const isReceiver = message.from !== user?.id

        if (!isReceiver) return

        const update = {
            id: message.id,
            readReceipt: [{
                userId: user?.id!,
                status: currentUser ? IMessageReadReceipt.seen : IMessageReadReceipt.received
            }]
        }

        let key = { conversationId, to: message.from! }

        updates.upsert(key, update);

        sendReadReceiptChangeRequest(updates)
        
        setUnreadMessages(conversationId, [{ id: message.id, from: message.from! }])

        registerConversation(conversation, message)
        
        setMessageStore(conversationId, [message])
    }

    const onForwardMessageReceive = useCallback(({ conversation, messages }: { conversation: IIConversation, messages: IMessage[] }) => {
        const receiver = conversation?.members.find(m => m !== user?.id)!
        const isBlocked = blockedUsers.some(u => u.blockedId === receiver)

        if (isBlocked) return

        const conversationId = conversation.id

        const isBlockedUser = user?.blockedUsers.includes(conversationId)

        const currentUser = conversationId === socket.selectedConversation?.id

        const updates: IUpdates = new Map()

        messages.forEach(message => {
            const isReceiver = message.from !== user?.id

            if (isReceiver) {
                const update = {
                    id: message.id,
                    readReceipt: [{
                        userId: user?.id!,
                        status: currentUser ? IMessageReadReceipt.seen : IMessageReadReceipt.received
                    }]
                }

                let key = { conversationId, to: message.from! }

                updates.upsert(key, update);
                setUnreadMessages(conversationId, [{ id: message.id, from: message.from! }])
            }
        })

        sendReadReceiptChangeRequest(updates)
        registerConversation(conversation, messages.at(-1)!)
        setMessageStore(conversationId, messages)
    }, [user, blockedUsers])

    const handleBlockingUser = (res: IUBlockReq) => {
        addOrRemoveBlockedUser(res)
    }

    const handleUnBlockingUser = (res: IUBlockReq) => {
        addOrRemoveBlockedUser(res)
    }

    const handleMessageDelete = ({ conversationId, messages }: { conversationId: string, messages: IUpdatesCollection[] }, all: boolean = false) => {
        all ?
            updateUserMessages(conversationId, messages) :
            deleteUserMessages(conversationId, messages)
    }

    const onReadReceiptChangeRequest = useCallback(({ conversationId, updates }: { conversationId: string, updates: IUpdatesCollection[] }) => {
        updateReadReceipt(conversationId, updates)
    }, [user])

    const onSessionReceived = useCallback((session: { sessionId: string }) => {
        sessionStorage.setItem('sessionId', session.sessionId)
    }, [])

    const disconectSocket = useCallback(() => {
        socket?.disconnect()
    }, [])

    const connectSocket = useCallback(() => {
        const sessionId = sessionStorage.getItem("sessionId")

        if (sessionId) {
            socket.auth = { sessionId };
        } else {
            socket.auth = { user }
        }
        socket?.connect()
    }, [])

    //senders///////////////////////////

    const sendMessage = useCallback((message: IMessage, conversation: IIConversation) => {
        const blockedByUser = blockedByUsers.some(({ userId }) => userId === message.to)
        if (blockedByUser) Object.assign(message, { deletedFor: [message.to], to: '' })
        socket?.emit("message", { message, conversation })
    }, [user, blockedByUsers])

    const onMessageForward = useCallback<ISocketContext['onMessageForward']>((conversation, messages) => {
        socket.emit('forward message', { conversation, messages })
    }, [blockedByUsers])

    const sendReadReceiptChangeRequest = useCallback<ISocketContext['sendReadReceiptChangeRequest']>((updates) => {
        socket.emit('change readReceipt', Array.from(updates))
    }, [user])

    const sendMessageDeleteRequest = useCallback<ISocketContext['sendMessageDeleteRequest']>((updates, all = false) => {
        all ?
            socket.emit('request:delete_message', updates) :
            socket.emit('request:delete_message_for_user', updates)
    }, [user])

    const sendGroupCreationRequest = useCallback((displayName: string, members: string[]) => {
        socket.emit('create group', { displayName, members })
    }, [user])

    const sendUserBlockRequest = (req: IUBlockReq) => {
        socket.emit('REQUEST:BLOCK_USER', req)
    }

    const sendUserUnBlockRequest = (req: IUBlockReq) => {
        socket.emit('REQUEST:UNBLOCK_USER', req)
    }

    //HELPERS///////////////////////////

    function addOrRemoveBlockedUser(req: IUBlockReq) {
        setBlockedUsers(s => s.some(r => r.blockedId === req.blockedId) ? s.filter(m => m.blockedId !== req.blockedId) : [req, ...s])
        setBlockedByUsers(s => s.some(r => r.blockedId === req.blockedId) ? s.filter(m => m.blockedId !== req.blockedId) : [req, ...s])
    }

    function registerConversation(conversation: IIConversation | IGroupConversation, message?: IMessage) {
        setConversation({ ...conversation, recentMessage: message })
    }

    function registerConversations(conversations: IIConversation[]) {
        let updates: IUpdates = new Map()
        let messageStore: Map<string, IMessage[]> = new Map()

        conversations.forEach((conversation) => {
            const { messages, id } = conversation

            if (!messages) return

            if (!!messages.length) {
                let unreadMessages: IUnreadMessageMeta[] = [];

                for (let message of messages) {

                    const isReceiver = message.from !== user?.id

                    if (isReceiver) {
                        message.readReceipt.forEach(readReceipt => {
                            if (readReceipt?.status === IMessageReadReceipt.sent && readReceipt.userId === user?.id) {
                                const update: IUpdatesCollection = {
                                    id: message.id,
                                    readReceipt: [{
                                        userId: user?.id!,
                                        status: IMessageReadReceipt.received
                                    }]
                                };

                                let key = { conversationId: message.conversationId!, to: message.from! };
                                updates.upsert(key, update);
                            }

                            if (readReceipt?.status < IMessageReadReceipt.seen && readReceipt?.userId === user?.id)
                                unreadMessages.push({ id: message.id, from: message.from! });
                        })

                    }
                }

                setUnreadMessages(id, unreadMessages);
            }

            const recentMessage = messages.at(-1)
            delete conversation.messages

            messageStore.set(id, messages)
            registerConversation(conversation, recentMessage)
        })

        setMessages(messageStore)
        !!updates.size && sendReadReceiptChangeRequest(updates)
    }

    const values = {
        users,
        registerConversation,
        sendMessage,
        connectSocket,
        disconectSocket,
        sendReadReceiptChangeRequest,
        sendMessageDeleteRequest,
        handleMessageDelete,
        onMessageForward,
        sendGroupCreationRequest,
        addOrRemoveBlockedUser,
        blockedUsers,
        blockedByUsers,
        sendUserBlockRequest,
        sendUserUnBlockRequest
    }

    return (
        <SocketContext.Provider value={values}>
            {children}
        </SocketContext.Provider>
    )
}

