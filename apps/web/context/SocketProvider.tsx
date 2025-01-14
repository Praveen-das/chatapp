"use client";

import React, { createContext, useContext, useEffect, useRef } from "react";
import useAuth from "../hooks/useAuth";
import socket from "../lib/ws";
import { useMessageStore } from "../store/messageStore";
import { IMessageReadReceipt } from "../enums/enums";
import { useStore } from "../store/global";
import _ from "lodash";
import { useAttachments } from "../store/attachments";
import { useConversationStore } from "../store/conversationStore";
import {
  IUserConversation,
  IDeleteConversationRequest,
  IDeleteForUserRequest,
  IDeleteRequest,
  IGroupConversation,
  IGroupMember,
  IConversation,
  IClearConversationRequest,
  IConversationBase,
  INewConversation,
} from "../interfaces/conversationInterface";
import {
  IAttachment,
  IDeleteResponse,
  IImageAttachment,
  IImagePayload,
  IMessage,
  IReadReceiptUpdatesCollection,
  IUnreadMessageMeta,
  IUpdates,
  IUpdatesCollection,
  IUrlAttachment,
} from "../interfaces/messageInterface";
import { IBlocked, IUser } from "../interfaces/userInterface";
import { IGroupCreationReq } from "../interfaces/groupInterface";
import { generateMessageTemplate, processMessagesForUser } from "@lib/messages";
import ObjectID from "bson-objectid";
import {
  generateConversation,
  generateUserConversations,
} from "@lib/conversation";
import { parseUrl } from "@lib/utils";
import db from "@lib/idb";
import { decrypt } from "@lib/e2e";

declare global {
  interface Map<K, V> {
    upsert: (
      key: { conversationId: string; to: string },
      value: IReadReceiptUpdatesCollection
    ) => Map<K, V>;
  }
}

Map.prototype.upsert = function (key, value) {
  this.has(key) ? this.get(key)?.push(value) : this.set(key, [value]);

  return this;
};

const useContextData = () => {
  const { user, updateUser } = useAuth();
  const userRef = useRef<IUser | null>(null);
  const setUsers = useStore((s) => s.setUsers);
  const addNewUser = useStore((s) => s.addNewUser);

  const setConversation = useConversationStore((s) => s.setConversation);
  const setMessageStore = useMessageStore((s) => s.setMessageStore);
  const setUnreadMessages = useMessageStore((s) => s.setUnreadMessages);
  const updateUserMessages = useMessageStore((s) => s.updateUserMessages);
  const deleteUserMessages = useMessageStore((s) => s.deleteUserMessages);
  const updateReadReceipt = useMessageStore((s) => s.updateReadReceipt);
  const setMessageHistory = useMessageStore((s) => s.setMessageHistory);
  const updateConversation = useConversationStore((s) => s.updateConversation);
  const setAdmin = useConversationStore((s) => s.setAdmin);
  const updateGroupConversation = useConversationStore(
    (s) => s.updateGroupConversation
  );
  const addMembers = useConversationStore((s) => s.addMembers);
  const removeMember = useConversationStore((s) => s.removeMember);
  const setSelectedConversation = useConversationStore(
    (s) => s.setSelectedConversation
  );
  const setMediaStore = useAttachments((s) => s.setMediaStore);

  useEffect(() => {
    const sessionId = sessionStorage.getItem("sessionId");

    if (!user) return;

    if (sessionId) socket.auth = { sessionId };
    else socket.auth = { user };

    userRef.current = user;

    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    if (!socket.connected) socket.connect();
  }, [user]);

  useEffect(() => {
    socket.on("sessionId", onSessionReceived);
    socket.on("conversations", onReceiveConnectedUsers);
    socket.on("user connected", onUserConnected);
    socket.on("new user created", onNewUserCreated);
    socket.on("user disconnected", onUserDisconnected);
    socket.on("message receive", onMessageReceive);
    socket.on("change readReceipt", onReadReceiptChangeRequest);
    socket.on("request:delete_message", handleDeletingMessageForAll);
    socket.on("request:delete_message_for_user", handleDeletingMessageForUser);
    socket.on("UPDATE_USER_BLOCK_STATUS", handleUpdatingBlockStatus);
    socket.on("updateUserRule", handleUpdatingUserRule);

    socket.on("group created", handleCreatingGroup);
    socket.on("GROUP_ADD_MEMBERS", handleAddingMembersToGroup);
    socket.on("GROUP_REMOVE_MEMBER", handleRemovingMemberFromGroup);
    socket.on("UPDATE_GROUP", handleUpdatingGroup);
    socket.on("SET_GROUP_ADMIN", handleSettingGroupAdmin);
    socket.on("DELETE_CONVERSATION", handleDeletingConversation);
    socket.on("CREATE_USER_CONVERSATION", handleCreatingUserConversation);
    socket.on("UPDATE_CONVERSATION", handleUpdatingConversation);

    return () => {
      socket.off("session", onSessionReceived);
      socket.off("conversations", onReceiveConnectedUsers);
      socket.off("user connected", onUserConnected);
      socket.off("new user created", onNewUserCreated);
      socket.off("user disconnected", onUserDisconnected);
      socket.off("message receive", onMessageReceive);
      socket.off("change readReceipt", onReadReceiptChangeRequest);
      socket.off("request:delete_message");
      socket.off(
        "request:delete_message_for_user",
        handleDeletingMessageForUser
      );
      socket.off("UPDATE_USER_BLOCK_STATUS", handleUpdatingBlockStatus);
      socket.off("updateUserRule", handleUpdatingUserRule);

      socket.off("group created", handleCreatingGroup);
      socket.off("GROUP_ADD_MEMBERS", handleAddingMembersToGroup);
      socket.off("GROUP_REMOVE_MEMBER", handleRemovingMemberFromGroup);
      socket.off("UPDATE_GROUP", handleUpdatingGroup);
      socket.off("SET_GROUP_ADMIN", handleSettingGroupAdmin);
      socket.off("DELETE_CONVERSATION", handleDeletingConversation);
      socket.off("CREATE_USER_CONVERSATION", handleCreatingUserConversation);
      socket.off("UPDATE_CONVERSATION", handleUpdatingConversation);
    };
  }, []);

  // receivers///////////////////////////

  async function onReceiveConnectedUsers({
    contacts,
    conversations,
  }: {
    contacts: IUser[];
    conversations: IUserConversation[];
  }) {
    registerConversations(conversations);
    setUsers(contacts);
  }

  const onUserConnected = ({ userId }: { userId: string }) => {
    useConversationStore.getState().updateUserStatus(userId, "online");
  };

  const onUserDisconnected = ({
    userId,
    lastSeen,
  }: {
    userId: string;
    lastSeen: number;
  }) => {
    useConversationStore
      .getState()
      .updateUserStatus(userId, "offline", lastSeen);
  };

  const onNewUserCreated = (user: IUser) => {
    addNewUser(user);
  };

  async function onMessageReceive({
    messages: _messages,
    conversationId: userConversationId,
  }: {
    messages: IMessage[];
    conversationId: string;
  }) {
    const conversations = useConversationStore.getState().conversations;
    const updatesCollection: IUpdates = new Map();
    let conversation = conversations.find(
      (c) => c.conversationId === userConversationId
    );

    if (!conversation) return;

    const conversationId = conversation.id;
    const currentUser = conversationId === socket.selectedConversation?.id;

    const status = currentUser
      ? userRef.current?.rules?.readReceipts.isVisible
        ? IMessageReadReceipt.seen
        : IMessageReadReceipt.unseen
      : IMessageReadReceipt.received;

    const {
      unreadMessages,
      updates,
      messages,
      imageAttachments,
      urlAttachments,
    } = processMessagesForUser(userRef.current?.id!, status, _messages);

    const mediaStore = { images: imageAttachments, link: urlAttachments };
    const recentMessage = messages.at(-1);

    if (!!updates.length) {
      updates.forEach(({ key, value }) => {
        updatesCollection.upsert(key, value);
      });
    }

    const conversationUpdates = {
      recentMessage,
      updatedAt: recentMessage?.timestamp,
    };

    if (!conversation.active) {
      socket.emit("ACTIVATE_CONVERSATION", conversationId);
      updateConversation(conversationId, {
        ...conversationUpdates,
        active: true,
      });
    } else updateConversation(conversationId, conversationUpdates);

    setMediaStore(conversationId, mediaStore);
    setUnreadMessages(conversationId, unreadMessages);
    setMessageStore(conversationId, messages);
    sendReadReceiptChangeRequest(updatesCollection);

    if (!currentUser) {
      let receiver = { id: "", username: "", icon: "" };

      if (conversation.host === "user") {
        const member = conversation.members.find(
          (m) => m.id !== conversation.userId
        )!;
        if (!member) return;
        receiver.id = member.id;
        receiver.username = member.username;
        receiver.icon = member.rules?.profilePicture.isVisible
          ? member.profilePicture
          : "";
      } else {
        receiver.id = conversation.id!;
        receiver.username = conversation.displayName!;
        receiver.icon = conversation.profilePicture;
      }

      if (!receiver) return;

      const text = decrypt(recentMessage?.message!);

      const notificationDisabledForUser = await db.get(receiver.id);
      !notificationDisabledForUser &&
        sendBrowserNotification(text, receiver.username, receiver.icon);
    }
  }

  const handleUpdatingBlockStatus = (
    conversationId: string,
    updates: Partial<IUserConversation>
  ) => {
    const userConversation = useConversationStore
      .getState()
      .conversations.find((c) => c.conversationId === conversationId);
    updateConversation(userConversation?.id!, updates);
  };

  const handleDeletingMessageForAll = ({
    conversationId,
    messages,
  }: IDeleteResponse) => {
    const conversation = useConversationStore
      .getState()
      .conversations.find((c) => c.conversationId === conversationId)!;

    const updateConversation =
      useConversationStore.getState().updateConversation;

    messages.forEach((m) => {
      if (m.id === conversation?.recentMessage?.id)
        updateConversation(conversation.id, {
          recentMessage: { ...conversation.recentMessage!, deleted: true },
        });
    });

    updateUserMessages(conversation.id, messages);
  };

  const handleDeletingMessageForUser = ({
    conversationId,
    collection,
  }: IDeleteForUserRequest) => {
    const id = useConversationStore
      .getState()
      .conversations.find((c) => c.conversationId === conversationId)?.id!;

    deleteUserMessages(id, collection);
  };

  const handleCreatingGroup = (group: IUserConversation) => {
    setConversation(group);
  };

  const onSessionReceived = (sessionId: string) => {
    sessionStorage.setItem("sessionId", sessionId);
  };

  const disconectSocket = () => {
    socket?.disconnect();
  };

  const connectSocket = () => {
    const sessionId = sessionStorage.getItem("sessionId");

    if (sessionId) {
      socket.auth = { sessionId };
    } else {
      socket.auth = { user };
    }
    socket?.connect();
  };

  const handleUpdatingUserRule = ({
    userId,
    rules,
  }: {
    userId: string;
    rules: IUserRules;
  }) => {
    if (userId === userRef.current?.id) {
      let updates = { ...userRef.current?.rules, ...rules };
      updateUser("rules", updates);

      const newUsers = { ...userRef.current, ["rules"]: updates };

      sessionStorage.setItem("user", JSON.stringify(newUsers));
      return;
    }

    useConversationStore.getState().updateConversationRule(userId, rules);
  };

  const handleUpdatingGroup = (
    { id, ...updates }: IGroupConversation,
    systemMessage: IMessage
  ) => {
    const conversationId = useConversationStore
      .getState()
      .conversations.find((c) => c.conversationId === id)?.id!;

    if (systemMessage) setMessageStore(conversationId, [systemMessage]);
    updateGroupConversation(conversationId, updates);
  };

  const handleAddingMembersToGroup = (
    {
      conversation,
      conversationId,
      members,
    }: {
      conversation: IGroupConversation;
      conversationId: string;
      members: IGroupMember[];
    },
    systemMessages: IMessage[]
  ) => {
    const conversations = useConversationStore.getState().conversations;

    if (conversations.find((c) => c.conversationId === conversationId)) {
      addMembers(conversationId, members);
    } else {
      registerConversations([conversation]);
    }

    const id = useConversationStore
      .getState()
      .conversations.find((c) => c.conversationId === conversationId)?.id!;

    if (systemMessages) setMessageStore(id, systemMessages);
  };

  const handleRemovingMemberFromGroup = (
    { conversationId, userId }: { conversationId: string; userId: string },
    systemMessages: IMessage[]
  ) => {
    console.log({ conversationId, userId, systemMessages });
    const id = useConversationStore
      .getState()
      .conversations.find((c) => c.conversationId === conversationId)?.id!;

    if (!!systemMessages.length) setMessageStore(id, systemMessages);
    removeMember(id, userId);
  };

  const handleDeletingConversation = (conversationId: string) => {
    updateConversation(conversationId, { active: false });
  };

  const deleteGroupConversation = (conversation: IConversation) => {
    useConversationStore.getState().deleteConversation(conversation.id);
    sendGroupConversationDeleteRequest(conversation);
    setSelectedConversation(null);
  };

  const handleSettingGroupAdmin = setAdmin;

  const handleUpdatingConversation = (
    conversationId: string,
    update: Partial<IConversationBase>
  ) => {
    useConversationStore.getState().updateConversation(conversationId, update);
  };

  const handleCreatingUserConversation = (conversation: IUserConversation) => {
    setConversation(conversation);
  };

  //senders///////////////////////////
  const sendRequestToRegisterStarredMessage = (req: {
    conversationId: string;
    messageIds: string[];
    host: "user" | "group";
  }) => {
    socket.emit("REGISTER_STARRED_MESSAGES", req);
  };

  const sendRequestToUnRegisterStarredMessage = (req: {
    conversationId: string;
    messageId: string;
    host: "user" | "group";
  }) => {
    socket.emit("UNREGISTER_STARRED_MESSAGES", req);
  };

  const sendRequestToRegisterConversation = (
    conversation: INewConversation
  ) => {
    socket.emit("REGISTER_CONVERSATION", conversation);
  };

  const sendRequestToRegisterUserConversation = (
    conversations: IUserConversation[]
  ) => {
    socket.emit("REGISTER_USER_CONVERSATION", conversations);
  };

  const sendRequestToArchiveConversation = (conversation: IConversation) => {
    socket.emit("ARCHIVE_CONVERSATION", conversation);
  };

  const sendRequestToUnarchiveConversation = (conversation: IConversation) => {
    socket.emit("UNARCHIVE_CONVERSATION", conversation);
  };

  const sendRequestToClearUserConversation = (id: string) => {
    socket.emit("CLEAR_CONVERSATION", id);
  };

  const sendRequestToClearGroupConversation = (id: string) => {
    socket.emit("CLEAR_GROUP_CONVERSATION", id);
  };

  const sendConversationDeleteRequest = (id: string) => {
    socket.emit("DELETE_CONVERSATION", id);
  };

  const sendGroupConversationDeleteRequest = (conversation: IConversation) => {
    socket.emit("DELETE_GROUP_CONVERSATION", conversation);
  };

  const makeAdmin = (conversationId: string, userId: string) => {
    socket.emit("USER_MAKE_ADMIN", { conversationId, userId });
  };

  const removeFromAdmin = (conversationId: string, userId: string) => {
    socket.emit("USER_REMOVE_FROM_ADMIN", { conversationId, userId });
  };

  const removeMemberFromGroup = (
    conversation: IGroupConversation,
    user: IGroupMember
  ) => {
    socket.emit("GROUP_REMOVE_MEMBER", { conversation, user });
  };

  const addMembersToGroup = (
    conversation: IGroupConversation,
    members: IUser[]
  ) => {
    socket.emit("GROUP_ADD_MEMBERS", { conversation, members });
  };

  const sendGroupjoinRequest = (
    conversation: IGroupConversation,
    user: IUser,
    conversationExist = false
  ) => {
    socket.emit("JOIN_GROUP", { conversation, user, conversationExist });
  };

  const leaveGroup = (conversation: IGroupConversation, user: IUser) => {
    socket.emit("LEAVE_GROUP", { conversation, user });
  };

  const findGroupById = (conversationId: string) => {
    socket.emit("GROUP_FIND_BY_ID", conversationId);
  };

  const sendMessage = (conversation: IConversation, messages: IMessage[]) => {
    let conversationId = conversation.conversationId!;
    let receivers;

    if (conversation.host === "user") {
      if (conversation.blockedByUser) {
        receivers = [];
        messages = messages.map((m) => ({ ...m, to: "" }));
      } else {
        receivers = conversation?.members.map(({ id }) => id);
      }
    } else receivers = conversation.channelId;

    socket.emit("message", {
      messages,
      conversationId,
      to: receivers,
    });
  };

  const deleteMessageForAll = (updates: IDeleteRequest) => {
    socket.emit("request:delete_message", updates);
  };

  const deleteMessagesForUser = (req: IDeleteForUserRequest) => {
    socket.emit("request:delete_message_for_user", req);
  };

  const sendGroupCreationRequest = (req: IGroupCreationReq) => {
    socket.emit("create group", req);
  };

  const sendUserBlockRequest = (
    conversation: IUserConversation | INewConversation,
    create = false
  ) => {
    socket.emit("UPDATE_USER_BLOCK_STATUS", conversation, true, create);
  };

  const sendUserUnBlockRequest = (conversation: IUserConversation) => {
    socket.emit("UPDATE_USER_BLOCK_STATUS", conversation, false);
  };

  const sendUserRuleChangeRequest = (req: {
    userId: string;
    rules: Partial<IUserRules>;
  }) => {
    socket.emit("updateUserRule", req);
  };

  const updateUserInfo = (req: { userId: string; updates: Partial<IUser> }) => {
    socket.emit("updateUser", req);
  };

  const sendGroupInfoUpdateRequest = (
    conversation: IGroupConversation,
    updates: Partial<IGroupConversation>
  ) => {
    socket.emit("updateGroupInfo", { conversation, updates });
  };

  //HELPERS///////////////////////////

  function registerConversations(conversations: IConversation[]) {
    const messageStore: Map<string, IMessage[]> = new Map();
    const updatesCollection: IUpdates = new Map();

    conversations.forEach((conversation) => {
      let conversationId = conversation.id;

      const {
        unreadMessages,
        updates,
        messages,
        imageAttachments,
        urlAttachments,
      } = processMessagesForUser(
        userRef.current?.id!,
        IMessageReadReceipt.received,
        conversation.messages
      );

      if (!!updates.length) {
        updates.forEach(({ key, value }) => {
          updatesCollection.upsert(key, value);
        });
      }

      if (conversation.host === "user") {
        const displayName = conversation.members.find(
          (m) => m.id !== conversation.userId
        )?.username;
        conversation.displayName = displayName;
      }

      const mediaStore = { images: imageAttachments, link: urlAttachments };
      const recentMessage = messages?.at(-1);

      if (recentMessage) {
        conversation.recentMessage = recentMessage;
        conversation.updatedAt = recentMessage.timestamp;
      }

      setConversation(conversation);

      messageStore.set(conversationId, messages || []);

      setMediaStore(conversationId, mediaStore);
      setUnreadMessages(conversationId, unreadMessages);

      delete conversation.messages;
    });

    setMessageHistory(messageStore);
    !!updatesCollection.size && sendReadReceiptChangeRequest(updatesCollection);
  }

  function sendBrowserNotification(
    message: string,
    username: string,
    icon: string
  ) {
    if (Notification.permission === "granted") {
      new Notification(`New message from ${username}`, {
        body: message,
        icon,
      });
    }
  }

  const sendReadReceiptChangeRequest = (updates: IUpdates) => {
    socket.emit("change readReceipt", Array.from(updates));
  };

  const onReadReceiptChangeRequest = ({
    conversationId,
    updates,
  }: {
    conversationId: string;
    updates: IReadReceiptUpdatesCollection[];
  }) => {
    console.log({ conversationId, updates });
    const id = useConversationStore
      .getState()
      .conversations.find((c) => c.conversationId === conversationId)?.id!;
    updateReadReceipt(id, updates);
  };

  return {
    sendMessage,
    connectSocket,
    disconectSocket,
    sendReadReceiptChangeRequest,
    deleteMessageForAll,
    deleteMessagesForUser,
    sendGroupCreationRequest,
    updateUserInfo,
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
    leaveGroup,
    sendConversationDeleteRequest,
    sendGroupConversationDeleteRequest,
    sendRequestToClearGroupConversation,
    sendRequestToClearUserConversation,
    sendRequestToArchiveConversation,
    sendRequestToUnarchiveConversation,
    deleteGroupConversation,
    sendRequestToRegisterConversation,
    sendRequestToRegisterUserConversation,
    sendRequestToRegisterStarredMessage,
    sendRequestToUnRegisterStarredMessage,
  };
};

type ISocketContext = ReturnType<typeof useContextData>;

const SocketContext = createContext<ISocketContext | null>(null);

export const SockerProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const data = useContextData();
  return (
    <SocketContext.Provider value={data}>{children}</SocketContext.Provider>
  );
};

interface IUserSocket {
  (): ISocketContext;
  getState: () => ISocketContext;
}

let state: ISocketContext;

const useSocket: IUserSocket = (): ISocketContext => {
  const context = useContext(SocketContext)!;
  if (!context) throw new Error(`Context not found`);
  state = context;
  return context;
};

useSocket.getState = () => state;

export default useSocket;
