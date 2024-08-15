"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import useAuth from '../hooks/useAuth';
import socket from "../lib/ws";
import { useMessageStore } from "../store/messageStore";
import { IMessageReadReceipt } from "../enums/enums";
import { useStore } from "../store/global";
import _ from 'lodash'
import { useAttachments } from "../store/attachments";
import { useConversationStore } from "../store/conversationStore";

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

const useContextData = () => {
    const { user, updateUser } = useAuth()
    const userRef = useRef<IUser | null>(null)
    const setUsers = useStore(s => s.setUsers)
    const addNewUser = useStore(s => s.addNewUser)
    const updateUserRule = useStore(s => s.updateUserRule)

    const [blockedUsers, setBlockedUsers] = useState<IUBlockReq[]>([])
    const [blockedByUsers, setBlockedByUsers] = useState<IUBlockReq[]>([])

    const setConversation = useConversationStore(s => s.setConversation)
    const setMessageStore = useMessageStore(s => s.setMessageStore)
    const setUnreadMessages = useMessageStore(s => s.setUnreadMessages)
    const updateUserMessages = useMessageStore(s => s.updateUserMessages)
    const deleteUserMessages = useMessageStore(s => s.deleteUserMessages)
    const updateReadReceipt = useMessageStore(s => s.updateReadReceipt)
    const setMessageHistory = useMessageStore(s => s.setMessageHistory)
    const updateConversation = useConversationStore(s => s.updateConversation)
    const addMembers = useConversationStore(s => s.addMembers)
    const removeMember = useConversationStore(s => s.removeMember)
    const addToMediaStore = useAttachments(s => s.addToMediaStore)
    const updateUserStatus = useStore(s => s.updateUserStatus)

    useEffect(() => {
        const sessionId = sessionStorage.getItem("sessionId")

        if (!user) return

        if (sessionId) {
            socket.auth = { sessionId };
        } else {
            socket.auth = { user }
        }

        userRef.current = user

        if (Notification.permission !== 'granted') {
            Notification.requestPermission();
        }

        socket.connect()

        return () => {
            socket.disconnect()
        }

    }, [user])

    useEffect(() => {
        socket.on('sessionId', onSessionReceived)
        socket.on("conversations", onReceiveConnectedUsers);
        socket.on("user connected", onUserConnected);
        socket.on("new user created", onNewUserCreated);
        socket.on("user disconnected", onUserDisconnected);
        socket.on('message receive', onMessageReceive)
        socket.on('change readReceipt', onReadReceiptChangeRequest)
        socket.on('request:delete_message', res => handleMessageDelete(res, true))
        socket.on('request:delete_message_for_user', handleMessageDelete)
        socket.on('RESPONSE:BLOCK_USER', handleBlockingUser)
        socket.on('RESPONSE:UNBLOCK_USER', handleUnBlockingUser)
        socket.on('updateUserRule', handleUpdatingUserRule)

        socket.on('group created', handleCreatingGroup)
        socket.on('GROUP_ADD_MEMBERS', handleAddingMembersToGroup)
        socket.on('GROUP_REMOVE_MEMBER', handleRemovingMemberFromGroup)
        socket.on('UPDATE_GROUP', handleUpdatingGroup)

        return () => {
            socket.off('session', onSessionReceived)
            socket.off('conversations', onReceiveConnectedUsers)
            socket.off('user connected', onUserConnected)
            socket.off("new user created", onNewUserCreated);
            socket.off('user disconnected', onUserDisconnected)
            socket.off('message receive', onMessageReceive)
            socket.off('change readReceipt', onReadReceiptChangeRequest)
            socket.off('request:delete_message')
            socket.off('request:delete_message_for_user', handleMessageDelete)
            socket.off('RESPONSE:BLOCK_USER', handleBlockingUser)
            socket.off('RESPONSE:UNBLOCK_USER', handleUnBlockingUser)
            socket.off('updateUserRule', handleUpdatingUserRule)

            socket.off('group created', handleCreatingGroup)
            socket.off('GROUP_ADD_MEMBERS', handleAddingMembersToGroup)
            socket.off('GROUP_REMOVE_MEMBER', handleRemovingMemberFromGroup)
            socket.off('UPDATE_GROUP', handleUpdatingGroup)
        }
    }, [])

    // receivers///////////////////////////

    const onReceiveConnectedUsers = (
        {
            contacts,
            conversations,
            blockedUsers,
            blockedByUsers,
        }: {
            contacts: IUser[],
            blockedUsers: IUBlockReq[],
            blockedByUsers: IUBlockReq[],
            conversations: IConversation[],
        }) => {

        registerConversations(conversations)

        setUsers(contacts)

        setBlockedUsers(blockedUsers)

        setBlockedByUsers(blockedByUsers)
    }

    const onUserConnected = ({ userId }: { userId: string }) => {
        updateUserStatus(userId, 'online')
    }

    const onUserDisconnected = ({ userId }: { userId: string }) => {
        updateUserStatus(userId, 'offline')
    }

    const onNewUserCreated = (user: IUser) => {
        addNewUser(user)
    }

    function onMessageReceive({ messages, conversation }: { messages: IMessage[], conversation: IConversation }) {
        const conversationId = conversation.id!
        const updates: IUpdates = new Map()
        const currentUser = conversationId === socket.selectedConversation?.id
        const status = currentUser ? userRef.current?.rules?.readReceipts.isVisible ?
            IMessageReadReceipt.seen : IMessageReadReceipt.unseen : IMessageReadReceipt.received

        messages.forEach(message => {
            const isReceiver = message.from !== userRef.current?.id

            if (!isReceiver) return

            if (message.attachment) {
                let attachment = message.attachment
                let type = attachment.type

                if (attachment.type === 'images') attachment.sender = message.from

                addToMediaStore(conversationId, type, [attachment])
            }


            const update = {
                id: message.id,
                readReceipt: [{ userId: userRef.current?.id!, status }]
            }

            let key = { conversationId, to: message.from! }

            updates.upsert(key, update);

            setUnreadMessages(conversationId, [{ id: message.id, from: message.from! }])

            setMessageStore(conversationId, [message])
        });

        !currentUser && sendBrowserNotification(messages.at(-1)!)

        sendReadReceiptChangeRequest(updates)

        registerConversation(conversation, messages.at(-1))
    }

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

    const handleCreatingGroup = (group: IConversation) => {
        registerConversation(group)
    }

    const onSessionReceived = (sessionId: string) => {
        sessionStorage.setItem('sessionId', sessionId)
    }

    const disconectSocket = () => {
        socket?.disconnect()
    }

    const connectSocket = () => {
        const sessionId = sessionStorage.getItem("sessionId")

        if (sessionId) {
            socket.auth = { sessionId };
        } else {
            socket.auth = { user }
        }
        socket?.connect()
    }

    const handleUpdatingUserRule = ({ userId, rules }: { userId: string, rules: IUserRules }) => {
        if (userId === userRef.current?.id) {
            let updates = { ...userRef.current?.rules, ...rules }
            updateUser('rules', updates)

            const newUsers = { ...userRef.current, ['rules']: updates }

            sessionStorage.setItem('user', JSON.stringify(newUsers))
            return
        }

        updateUserRule(userId, rules)
    }

    const handleUpdatingGroup = (conversation: IConversation, systemMessage: IMessage) => {
        if (systemMessage) setMessageStore(conversation.id, [systemMessage])
        updateConversation(conversation.id, conversation as IGroupConversation)
    }

    const handleAddingMembersToGroup = ({ conversation, members }: { conversation: IGroupConversation, members: IUser[] }, systemMessage: IMessage) => {
        if (systemMessage) setMessageStore(conversation.id, [systemMessage])
        const conversations = useConversationStore.getState().conversations
        if (conversations.find(c => c.id === conversation.id))
            addMembers(conversation.id, members)
        else {
            registerConversations([conversation as IConversation])
        }
    }

    const handleRemovingMemberFromGroup = ({ id, userId }: { id: string, userId: string }, systemMessage: IMessage) => {
        if (systemMessage) setMessageStore(id, [systemMessage])
        removeMember(id, userId, userId === userRef.current?.id)
    }

    //senders///////////////////////////

    const makeAdmin = (conversationId: string, userId: string) => {
        socket.emit('USER_MAKE_ADMIN', { conversationId, userId })
    }

    const removeFromAdmin = (conversationId: string, userId: string) => {
        socket.emit('USER_REMOVE_FROM_ADMIN', { conversationId, userId })
    }

    const removeMemberFromGroup = (conversationId: string, userId: string) => {
        socket.emit('GROUP_REMOVE_MEMBER', { conversationId, userId })
    }

    const addMembersToGroup = (conversation: IGroupConversation, users: string[]) => {
        socket.emit('GROUP_ADD_MEMBERS', { conversation, users })
    }

    const sendGroupjoinRequest = (conversation: IGroupConversation, user: IUser) => {
        socket.emit('GROUP_JOIN', { conversation, user })
    }

    const leaveGroup = (conversation: IGroupConversation, user: IUser) => {
        socket.emit('GROUP_LEAVE', { conversation, user })
    }

    const findGroupById = (conversationId: string) => {
        socket.emit('GROUP_FIND_BY_ID', conversationId)
    }

    const sendMessage = (messages: IMessage[], _conversation: IConversation) => {
        let conversation = { ..._conversation }
        const receiver = conversation.members.find(m => m.id !== userRef.current?.id)
        const blockedByUser = blockedByUsers.some(({ userId }) => userId === receiver?.id)

        if (blockedByUser) {
            messages.forEach(message => Object.assign(message, { deletedFor: [message.to], to: '' }))
            Object.assign(conversation, { members: conversation.members.filter(m => m.id === userRef.current?.id) })
        }

        socket?.emit("message", { messages, conversation })
    }

    const sendMessageDeleteRequest = (updates: IDeleteRequest, all = false) => {
        all ?
            socket.emit('request:delete_message', updates) :
            socket.emit('request:delete_message_for_user', updates)
    }

    const sendGroupCreationRequest = (displayName: string, members: string[]) => {
        socket.emit('create group', { displayName, members })
    }

    const sendUserBlockRequest = (req: IUBlockReq) => {
        socket.emit('REQUEST:BLOCK_USER', req)
    }

    const sendUserUnBlockRequest = (req: IUBlockReq) => {
        socket.emit('REQUEST:UNBLOCK_USER', req)
    }

    const sendUserRuleChangeRequest = (req: { userId: string, rules: Partial<IUserRules> }) => {
        socket.emit('updateUserRule', req)
    }

    const sendGroupInfoUpdateRequest = (conversation: IGroupConversation, updates: Partial<IGroupConversation>) => {
        socket.emit('updateGroupInfo', { conversation, updates })
    }

    //HELPERS///////////////////////////

    function addOrRemoveBlockedUser(req: IUBlockReq) {
        setBlockedUsers(s => s.some(r => r.blockedId === req.blockedId) ? s.filter(m => m.blockedId !== req.blockedId) : [req, ...s])
        setBlockedByUsers(s => s.some(r => r.blockedId === req.blockedId) ? s.filter(m => m.blockedId !== req.blockedId) : [req, ...s])
    }

    function registerConversation(conversation: IConversation, message?: IMessage) {
        setConversation({ ...conversation, recentMessage: message })
    }

    function registerConversations(conversations: IConversation[]) {
        let updates: IUpdates = new Map()
        let messageStore: Map<string, IMessage[]> = new Map()

        conversations.forEach((conversation) => {
            const { messages, id } = conversation

            if (conversation.host === 'user')
                conversation.displayName = conversation.members.find(m => m.id !== userRef.current?.id)?.username

            if (!messages) return

            if (!!messages.length) {
                let unreadMessages: IUnreadMessageMeta[] = [];

                for (let message of messages) {
                    const isReceiver = message.from !== userRef.current?.id
                    if (message.attachment) {
                        let attachment = message.attachment
                        let type = attachment.type

                        if (attachment.type === 'images') attachment.sender = message.from

                        addToMediaStore(conversation.id, type, [attachment])
                    }

                    if (isReceiver) {
                        message.readReceipt.forEach(readReceipt => {
                            if (readReceipt?.status === IMessageReadReceipt.sent && readReceipt.userId === userRef.current?.id) {
                                const update: IUpdatesCollection = {
                                    id: message.id,
                                    readReceipt: [{
                                        userId: userRef.current?.id!,
                                        status: IMessageReadReceipt.received
                                    }]
                                };

                                let key = { conversationId: message.conversationId!, to: message.from! };
                                updates.upsert(key, update);
                            }

                            if (readReceipt?.status < IMessageReadReceipt.seen && readReceipt?.userId === userRef.current?.id)
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

        setMessageHistory(messageStore)
        !!updates.size && sendReadReceiptChangeRequest(updates)
    }

    function sendBrowserNotification(message: IMessage) {
        if (Notification.permission === 'granted') {
            new Notification('New message', {
                body: 'This is the body of the notification.',
                icon: 'path/to/icon.png',
            });
        }
    }

    const sendReadReceiptChangeRequest = (updates: IUpdates) => {
        socket.emit('change readReceipt', Array.from(updates))
    }

    const onReadReceiptChangeRequest = ({ conversationId, updates }: { conversationId: string, updates: IUpdatesCollection[] }) => {
        updateReadReceipt(conversationId, updates)
    }

    return {
        registerConversation,
        sendMessage,
        connectSocket,
        disconectSocket,
        sendReadReceiptChangeRequest,
        sendMessageDeleteRequest,
        handleMessageDelete,
        sendGroupCreationRequest,
        addOrRemoveBlockedUser,
        blockedUsers,
        blockedByUsers,
        sendUserBlockRequest,
        sendUserUnBlockRequest,
        sendUserRuleChangeRequest,
        sendGroupInfoUpdateRequest,
        addMembersToGroup,
        findGroupById,
        removeMemberFromGroup,
        makeAdmin,
        removeFromAdmin,
        sendGroupjoinRequest,
        leaveGroup
    }
}

type ISocketContext = ReturnType<typeof useContextData>

const SocketContext = createContext<ISocketContext | null>(null)

export const SockerProvider: React.FC<SocketProviderProps> = ({ children }) => {
    const value = useContextData()
    return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}

interface IUserSocket {
    (): ISocketContext
    getState: () => ISocketContext
}

let state: ISocketContext

const useSocket: IUserSocket = (): ISocketContext => {
    const context = useContext(SocketContext)!
    if (!context) throw new Error(`Context not found`)
    state = context
    return context
}

useSocket.getState = () => state

export default useSocket
