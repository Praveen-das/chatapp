"use client";

import React, { createContext, useContext, useEffect, useRef } from "react";
import useAuth from "../hooks/useAuth";
import socket from "../lib/ws";
import { useMessageStore } from "../store/messageStore";
import { IMessageReadReceipt } from "../enums/enums";
import { useStore } from "../store/global";
import { useAttachments } from "../store/attachments";
import { useConversationStore } from "../store/conversationStore";
import {
  IUserConversation,
  IDeleteForUserRequest,
  IDeleteRequest,
  IGroupConversation,
  IGroupMember,
  IConversation,
  IConversationBase,
  INewConversation,
} from "../interfaces/conversationInterface";
import { IDeleteResponse, IMessage, IReadReceiptUpdatesCollection, IUpdates } from "../interfaces/messageInterface";
import { IUser } from "../interfaces/userInterface";
import { IGroupCreationReq } from "../interfaces/groupInterface";
import { processMessagesForUser } from "@lib/messages";
import { decrypt } from "@lib/e2e";
import { useRouter } from "next/navigation";
import { clearLocalSession, getRefreshToken } from "@actions/session";
import { getReceiver } from "@lib/conversation";
import idb from "@lib/idb";
import useIndexedDb from "@lib/idb";

declare global {
  interface Map<K, V> {
    upsert: (key: { conversationId: string; to: string }, value: IReadReceiptUpdatesCollection) => Map<K, V>;
  }
}

Map.prototype.upsert = function (key, value) {
  this.has(key) ? this.get(key)?.push(value) : this.set(key, [value]);

  return this;
};

const useContextData = () => {
  const { user, updateUser } = useAuth();
  const userRef = useRef<IUser | null>(null);
  const addNewUser = useStore((s) => s.addNewUser);
  const router = useRouter();

  const setConversation = useConversationStore((s) => s.setConversation);
  const setMessageStore = useMessageStore((s) => s.setMessageStore);
  const setUnreadMessages = useMessageStore((s) => s.setUnreadMessages);
  const updateUserMessages = useMessageStore((s) => s.updateUserMessages);
  const deleteUserMessages = useMessageStore((s) => s.deleteUserMessages);
  const updateReadReceipt = useMessageStore((s) => s.updateReadReceipt);
  const updateConversation = useConversationStore((s) => s.updateConversation);
  const setAdmin = useConversationStore((s) => s.setAdmin);
  const updateGroupConversation = useConversationStore((s) => s.updateGroupConversation);
  const addMembers = useConversationStore((s) => s.addMembers);
  const removeMember = useConversationStore((s) => s.removeMember);
  const setSelectedConversation = useConversationStore((s) => s.setSelectedConversation);
  const setMediaStore = useAttachments((s) => s.setMediaStore);
  const idb = useIndexedDb()

  useEffect(() => {
    if (!user) return;
    userRef.current = user;
    return () => {
      userRef.current = null;
    };
  }, [user]);

  useEffect(() => {
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
    socket.on("ADD_GROUP_TAG", handleAddingGroupTag);
    socket.on("REMOVE_GROUP_TAG", handleRemovingGroupTag);

    socket.on("END_SESSION", handleRemovingSession);

    return () => {
      socket.off("user connected", onUserConnected);
      socket.off("new user created", onNewUserCreated);
      socket.off("user disconnected", onUserDisconnected);
      socket.off("message receive", onMessageReceive);
      socket.off("change readReceipt", onReadReceiptChangeRequest);
      socket.off("request:delete_message");
      socket.off("request:delete_message_for_user", handleDeletingMessageForUser);
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
      socket.off("ADD_GROUP_TAG", handleAddingGroupTag);
      socket.off("REMOVE_GROUP_TAG", handleRemovingGroupTag);

      socket.off("END_SESSION", handleRemovingSession);
    };
  }, []);

  // receivers///////////////////////////

  const onUserConnected = ({ userId }: { userId: string }) => {
    useConversationStore.getState().updateUserStatus(userId, "online");
  };

  const onUserDisconnected = ({ userId, lastSeen }: { userId: string; lastSeen: number }) => {
    useConversationStore.getState().updateUserStatus(userId, "offline", lastSeen);
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
    let conversation = conversations.find((c) => c.conversationId === userConversationId);

    if (!conversation) return;

    const conversationId = conversation.id;
    const currentUser = conversationId === socket.selectedConversation?.id;

    const status = currentUser
      ? userRef.current?.rules?.readReceipts.isVisible
        ? IMessageReadReceipt.seen
        : IMessageReadReceipt.unseen
      : IMessageReadReceipt.received;

    const { updates, unreadMessages, messages, imageAttachments, urlAttachments, placeholders } =
      processMessagesForUser(userRef.current!, status, _messages);

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
      updateConversation(conversationId, { ...conversationUpdates, active: true });
    } else updateConversation(conversationId, conversationUpdates);

    if (!!placeholders?.length) updateUserMessages(conversationId, placeholders);
    if (!!messages.length) setMessageStore(conversationId, messages);

    setMediaStore(conversationId, mediaStore);
    setUnreadMessages(conversationId, unreadMessages);
    sendReadReceiptChangeRequest(updatesCollection);

    if (!currentUser) {
      let receiver = { id: "", username: "", icon: "" };

      if (conversation.host === "user") {
        const member = getReceiver(conversation);
        if (!member) return;
        receiver.id = member.id;
        receiver.username = member.username;
        receiver.icon = member.rules?.profilePicture.isVisible ? member.profilePicture : "";
      } else {
        receiver.id = conversation.id!;
        receiver.username = conversation.displayName!;
        receiver.icon = conversation.profilePicture;
      }

      if (!receiver) return;

      const text = decrypt(recentMessage?.message!);
      
      const notificationDisabledForUser = await idb.get(receiver.id);
      !notificationDisabledForUser &&
      sendBrowserNotification(text, receiver.username, receiver.icon);
    }
  }

  const handleUpdatingBlockStatus = (conversationId: string, updates: Partial<IUserConversation>) => {
    const userConversation = useConversationStore
      .getState()
      .conversations.find((c) => c.conversationId === conversationId);
    updateConversation(userConversation?.id!, updates);
  };

  const handleDeletingMessageForAll = ({ conversationId, messages }: IDeleteResponse) => {
    const conversation = useConversationStore
      .getState()
      .conversations.find((c) => c.conversationId === conversationId)!;

    const updateConversation = useConversationStore.getState().updateConversation;

    messages.forEach((m) => {
      if (m.id === conversation?.recentMessage?.id)
        updateConversation(conversation.id, {
          recentMessage: { ...conversation.recentMessage!, deleted: true },
        });
    });

    updateUserMessages(conversation.id, messages);
  };

  const handleDeletingMessageForUser = ({ conversationId, collection }: IDeleteForUserRequest) => {
    const id = useConversationStore.getState().conversations.find((c) => c.conversationId === conversationId)?.id!;

    deleteUserMessages(id, collection);
  };

  const handleCreatingGroup = (group: IUserConversation) => {
    setConversation(group);
  };

  const disconectSocket = () => {
    socket?.disconnect();
  };

  const connectSocket = () => {
    socket.auth = { user };
    socket?.connect();
  };

  const handleUpdatingUserRule = ({ userId, rules }: { userId: string; rules: IUserRules }) => {
    if (userId === userRef.current?.id) {
      let updates = { ...userRef.current?.rules, ...rules };
      updateUser("rules", updates);

      const newUsers = { ...userRef.current, ["rules"]: updates };

      sessionStorage.setItem("user", JSON.stringify(newUsers));
      return;
    }

    useConversationStore.getState().updateConversationRule(userId, rules);
  };

  const handleUpdatingGroup = ({ id, ...updates }: IGroupConversation, systemMessage: IMessage) => {
    const conversationId = useConversationStore.getState().conversations.find((c) => c.conversationId === id)?.id!;

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
      setConversation(conversation);
    }

    const id = useConversationStore.getState().conversations.find((c) => c.conversationId === conversationId)?.id!;

    if (systemMessages) setMessageStore(id, systemMessages);
  };

  const handleRemovingMemberFromGroup = (
    { conversationId, userId }: { conversationId: string; userId: string },
    systemMessages: IMessage[]
  ) => {
    const id = useConversationStore.getState().conversations.find((c) => c.conversationId === conversationId)?.id!;

    if (!!systemMessages.length) setMessageStore(id, systemMessages);
    if (userId === userRef.current?.id) clearConversationData(id);

    removeMember(id, userId);
  };

  const handleDeletingConversation = (conversationId: string) => {
    updateConversation(conversationId, { active: false });
  };

  const deleteGroupConversation = (conversation: IConversation) => {
    clearConversationData(conversation.id);
    sendGroupConversationDeleteRequest(conversation);
  };

  const handleSettingGroupAdmin = setAdmin;

  const handleUpdatingConversation = (conversationId: string, update: Partial<IConversationBase>) => {
    useConversationStore.getState().updateConversation(conversationId, update);
  };

  const handleCreatingUserConversation = (conversation: IUserConversation) => {
    setConversation(conversation);
  };

  const handleAddingGroupTag = (
    {
      groupId,
      tag,
    }: {
      groupId: string;
      tag: string;
    },
    systemMessages: IMessage[]
  ) => {
    const conversations = useConversationStore.getState().conversations;

    const id = conversations.find((c) => c.conversationId === groupId)?.id!;
    useConversationStore.getState().addGroupTag(id, tag);
    if (systemMessages) setMessageStore(id, systemMessages);
  };

  const handleRemovingGroupTag = (
    {
      groupId,
      tag,
    }: {
      groupId: string;
      tag: string;
    },
    systemMessages: IMessage[]
  ) => {
    const conversations = useConversationStore.getState().conversations;

    const id = conversations.find((c) => c.conversationId === groupId)?.id!;
    useConversationStore.getState().removeGroupTag(id, tag);
    if (systemMessages) setMessageStore(id, systemMessages);
  };

  const handleRemovingSession = async (expiredSessionId: string) => {
    const session = useAuth.getState().session;

    if (session?.sessionId === expiredSessionId) {
      await clearLocalSession();
      useAuth.getState().setUser?.(null);
      router.replace("/register");
    }
  };

  //senders///////////////////////////
  const sendRequestToEndSession = (sessionId: string) => {
    socket.emit("END_SESSION", sessionId);
  };

  const addGroupTag = (req: { conversation: IGroupConversation; tag: string }) => {
    socket.emit("ADD_GROUP_TAG", { ...req, admin: userRef.current });
  };

  const removeGroupTag = (req: { conversation: IGroupConversation; tag: string }) => {
    socket.emit("REMOVE_GROUP_TAG", { ...req, admin: userRef.current });
  };

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

  const sendRequestToRegisterConversation = (conversation: INewConversation) => {
    socket.emit("REGISTER_CONVERSATION", conversation);
  };

  const sendRequestToRegisterUserConversation = (conversations: IUserConversation[]) => {
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

  const makeAdmin = (conversation: IGroupConversation, userId: string) => {
    socket.emit("USER_MAKE_ADMIN", { conversation, userId });
  };

  const removeFromAdmin = (conversation: IGroupConversation, userId: string) => {
    socket.emit("USER_REMOVE_FROM_ADMIN", { conversation, userId });
  };

  const removeMemberFromGroup = (conversation: IGroupConversation, user: IGroupMember) => {
    socket.emit("GROUP_REMOVE_MEMBER", {
      conversation,
      user,
      admin: userRef.current,
    });
  };

  const addMembersToGroup = (conversation: IGroupConversation, members: IUser[]) => {
    socket.emit("GROUP_ADD_MEMBERS", {
      conversation,
      members,
      admin: userRef.current,
    });
  };

  const sendGroupjoinRequest = (conversation: IGroupConversation, user: IUser, conversationExist = false) => {
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

    // if (!conversation.active) {
    //   socket.emit("ACTIVATE_CONVERSATION", conversation.id);
    //   updateConversation(conversation.id, { active: true });
    // }

    // const recentMessage = messages.at(-1)!;

    // updateConversation(conversation?.id!, {
    //   recentMessage,
    //   updatedAt: recentMessage.timestamp,
    // });

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

  const sendUserBlockRequest = (conversation: IUserConversation | INewConversation, create = false) => {
    socket.emit("UPDATE_USER_BLOCK_STATUS", conversation, true, create);
  };

  const sendUserUnBlockRequest = (conversation: IUserConversation) => {
    socket.emit("UPDATE_USER_BLOCK_STATUS", conversation, false);
  };

  const sendUserRuleChangeRequest = (req: { userId: string; rules: Partial<IUserRules> }) => {
    const channels = getSocketChannels();
    socket.emit("updateUserRule", req, channels);
  };

  const updateUserInfo = (req: { userId: string; updates: Partial<IUser> }) => {
    socket.emit("updateUser", req);
  };

  const sendGroupInfoUpdateRequest = (conversation: IGroupConversation, updates: Partial<IGroupConversation>) => {
    socket.emit("updateGroupInfo", {
      conversation,
      updates,
      admin: userRef.current,
    });
  };

  //HELPERS///////////////////////////

  function clearConversationData(id: string) {
    const { deleteConversation } = useConversationStore.getState();
    const { clearChat, clearUnreadMessages } = useMessageStore.getState();

    clearChat(id);
    clearUnreadMessages(id);
    deleteConversation(id);
    setSelectedConversation(null);
  }

  function getSocketChannels() {
    const users = useStore.getState().users.map((u) => u.id);
    const groupMembers = useConversationStore.getState().conversations.reduce<Set<string>>((i, c) => {
      c.members.forEach((m) => i.add(m.id));
      return i;
    }, new Set());

    return [...new Set([...users, ...groupMembers])];
  }

  function sendBrowserNotification(message: string, username: string, icon: string) {
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
    const id = useConversationStore.getState().conversations.find((c) => c.conversationId === conversationId)?.id!;
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
    addGroupTag,
    removeGroupTag,

    sendRequestToEndSession,
  };
};

type ISocketContext = ReturnType<typeof useContextData>;

const SocketContext = createContext<ISocketContext | null>(null);

export const SockerProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const data = useContextData();
  return <SocketContext.Provider value={data}>{children}</SocketContext.Provider>;
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
