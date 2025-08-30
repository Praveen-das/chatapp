"use client";

import React, { createContext, PropsWithChildren, useContext, useEffect, useRef } from "react";
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
  IUserBlockRequest,
} from "@repo/interfaces/conversationInterface";
import {
  IDeleteResponse,
  IMessage,
  IReadReceiptUpdatesCollection,
  ISystemMessage,
  IUpdates,
} from "@repo/interfaces/messageInterface";
import { IUser, IUserRuleChangeRequest } from "@repo/interfaces/userInterface";
import { IGroupCreationReq } from "@repo/interfaces/groupInterface";
import { processMessagesForUser } from "@lib/messages";
import { getReceiver } from "@lib/conversation";
import useIndexedDb from "@lib/idb";
import { encrypt } from "@lib/e2e";
import { useSessionStore } from "store/sessionStore";
import { toast } from "react-toastify";
import { usePersistentStore } from "store/persistentStore";
import { IGroup } from "@interfaces/groupInterface";
import otp_socket from "@lib/ws_otp";

declare global {
  interface Map<K, V> {
    upsert: (key: { conversationId: string; to: string }, value: IReadReceiptUpdatesCollection) => Map<K, V>;
  }
}

Map.prototype.upsert = function (key, value) {
  this.has(key) ? this.get(key)?.push(value) : this.set(key, [value]);
  return this;
};

const {
  setConversation,
  updateConversation,
  setSelectedConversation,
  updateUserStatus,
  updateConversationRule,
  deleteConversation,
} = useConversationStore.getState().conversationActions;
const {
  setAdmin,
  updateGroupConversation,
  addMembers,
  removeMember,
  addGroupTag: _addGroupTag,
  removeGroupTag: _removeGroupTag,
} = useConversationStore.getState().groupActions;

const useContextData = () => {
  const { user, updateSession, signOut } = useAuth();
  const userRef = useRef<IUser | null>(null);
  const addNewUser = useStore((s) => s.addNewUser);

  const setMessageStore = useMessageStore((s) => s.setMessageStore);
  const setUnreadMessages = useMessageStore((s) => s.setUnreadMessages);
  const updateUserMessages = useMessageStore((s) => s.updateUserMessages);
  const deleteUserMessages = useMessageStore((s) => s.deleteUserMessages);
  const updateReadReceipt = useMessageStore((s) => s.updateReadReceipt);
  const setMediaStore = useAttachments((s) => s.setMediaStore);
  const userNotificationPref = usePersistentStore((s) => s.userNotificationPref);
  const idb = useIndexedDb();

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
    socket.on("UPDATE_USER_BLOCK_STATUS", handleUpdatingBlockStatus);

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
    socket.on("OTP_MESSAGE", handleOTPMessage);

    return () => {
      socket.off("user connected", onUserConnected);
      socket.off("new user created", onNewUserCreated);
      socket.off("user disconnected", onUserDisconnected);
      socket.off("message receive", onMessageReceive);
      socket.off("change readReceipt", onReadReceiptChangeRequest);
      socket.off("request:delete_message");
      socket.off("UPDATE_USER_BLOCK_STATUS", handleUpdatingBlockStatus);

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
      socket.off("OTP_MESSAGE", handleOTPMessage);
    };
  }, []);

  // receivers///////////////////////////

  const onUserConnected = ({ userId }: { userId: string }) => {
    updateUserStatus(userId, "online");
  };

  const onUserDisconnected = ({ userId, lastSeen }: { userId: string; lastSeen: number }) => {
    updateUserStatus(userId, "offline", lastSeen);
  };

  const onNewUserCreated = (user: IUser) => {
    addNewUser(user);
  };

  const onMessageReceive = async ({
    messages: _messages,
    conversationId: userConversationId,
  }: {
    messages: IMessage[];
    conversationId: string;
  }) => {
    const conversations = useConversationStore.getState().conversations;
    const updatesCollection: IUpdates = new Map();
    let conversation = conversations.find((c) => c.host === "system" || c.conversationId === userConversationId);

    if (!conversation) return;

    const conversationId = conversation.id;
    const currentUser = conversationId === socket.selectedConversation?.id;

    const status = currentUser
      ? userRef.current?.rules?.readReceipts.isVisible
        ? IMessageReadReceipt.seen
        : IMessageReadReceipt.unseen
      : IMessageReadReceipt.received;

    const { unreadMessages, messages, imageAttachments, urlAttachments, placeholders } = processMessagesForUser(
      userRef.current!,
      status,
      _messages,
      updatesCollection
    );

    const mediaStore = { images: imageAttachments, link: urlAttachments };
    const recentMessage = _messages.at(-1);

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
      let receiver = { id: "", displayName: "", icon: "" };

      if (conversation.host === "user") {
        const member = getReceiver(conversation);
        if (!member) return;
        receiver.id = member.id;
        receiver.displayName = member.username;
        receiver.icon = member.rules?.profilePicture.isVisible ? member.profilePicture : "";
      } else if (conversation.host === "group") {
        receiver.id = conversation.id!;
        receiver.displayName = conversation.displayName!;
        receiver.icon = conversation.profilePicture;
      }

      if (!receiver) return;

      const text = recentMessage?.message!;
      const notificationPermissionGranted = Notification.permission === "granted";
      let canSendNotification = conversation.host !== "system" && userNotificationPref[conversation.host];
      let notificationDisabledForConversation = await idb.get(receiver.id);

      notificationPermissionGranted &&
        canSendNotification &&
        !notificationDisabledForConversation &&
        sendBrowserNotification(text, receiver.displayName, receiver.icon);
    }
  };

  const handleUpdatingBlockStatus = (conversationId: string, updates: Partial<IUserConversation>) => {
    const conversation = useConversationStore
      .getState()
      .conversations.find((c) => c.host !== "system" && c.conversationId === conversationId);

    updateConversation(conversation?.id!, updates);
  };

  const handleDeletingMessageForAll = ({ conversationId, messages }: IDeleteResponse) => {
    const conversation = useConversationStore
      .getState()
      .conversations.find((c) => c.host !== "system" && c.conversationId === conversationId)!;

    if (conversation.host === "system") return;

    messages.forEach((m) => {
      if (m.id === conversation?.recentMessage?.id)
        updateConversation(conversation.id, {
          recentMessage: { ...conversation.recentMessage!, deleted: true },
        });
    });

    updateUserMessages(conversation.id, messages);
  };

  const handleDeletingMessageForUser = ({ conversationId, collection }: IDeleteForUserRequest) => {
    const id = useConversationStore
      .getState()
      .conversations.find((c) => c.host === "system" || c.conversationId === conversationId)?.id!;

    deleteUserMessages(id, collection);
  };

  const handleCreatingGroup = (group: IUserConversation) => {
    setConversation(group);
  };

  const disconectSocket = () => {
    socket?.disconnect();
  };

  const handleUpdatingUserRule = ({ userId, updates: { rules } }: IUserRuleChangeRequest) => {
    if (userId === userRef.current?.id) {
      let newRules = { ...userRef.current?.rules, ...rules };
      const newUsers = { ...userRef.current, rules: newRules, updatedAt: Date.now() } as IUser;

      updateSession(newUsers);

      return;
    }

    updateConversationRule(userId, rules);
  };

  const handleUpdatingGroup = ({ id, ...updates }: IGroupConversation, systemMessage: IMessage) => {
    const conversationId = useConversationStore
      .getState()
      .conversations.find((c) => c.host === "group" && c.conversationId === id)?.id!;

    if (systemMessage) setMessageStore(conversationId, [systemMessage]);
    updateGroupConversation(conversationId, updates);
  };

  const handleAddingMembersToGroup = (
    {
      conversation,
      conversationId,
      members,
      self,
    }: {
      conversation: IGroupConversation;
      conversationId: string;
      members: IGroupMember[];
      self: boolean;
    },
    systemMessages: IMessage[]
  ) => {
    const conversations = useConversationStore.getState().conversations;
    const existingConversation = conversations.find((c) => c.host === "group" && c.conversationId === conversationId);

    if (existingConversation) {
      addMembers(conversationId, members);
    } else {
      setConversation(conversation);
    }

    if (self) {
      setSelectedConversation(existingConversation?.id!);
      useStore.getState().setDeviceTab("chatarea");
    }

    if (systemMessages) setMessageStore(existingConversation?.id!, systemMessages);
  };

  const handleRemovingMemberFromGroup = (
    { conversationId, userId }: { conversationId: string; userId: string },
    systemMessages: IMessage[]
  ) => {
    const id = useConversationStore
      .getState()
      .conversations.find((c) => c.host === "group" && c.conversationId === conversationId)?.id!;

    if (!!systemMessages.length) setMessageStore(id, systemMessages);

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
    updateConversation(conversationId, update);
  };

  const handleCreatingUserConversation = (conversation: IUserConversation, select: boolean) => {
    if (select) {
      const receiver = getReceiver(conversation);

      setConversation(conversation);
      setSelectedConversation(conversation.id);
      addNewUser(receiver!);
      socket.selectedConversation = conversation;
    }
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

    const id = conversations.find((c) => c.host === "group" && c.conversationId === groupId)?.id!;
    _addGroupTag(id, tag);
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

    const id = conversations.find((c) => c.host === "group" && c.conversationId === groupId)?.id!;
    _removeGroupTag(id, tag);
    if (systemMessages) setMessageStore(id, systemMessages);
  };

  const handleRemovingSession = async (expiredSessionId: string) => {
    const sessions = useSessionStore.getState().activeSessions;

    sessions.forEach(async (s) => {
      if (s.sessionId === expiredSessionId) {
        await signOut();
      }
    });
  };

  const handleOTPMessage = (res: any) => {
    const message: ISystemMessage = {
      id: crypto.randomUUID(),
      conversationId: "system",
      to: user?.id,
      from: "system",
      type: "service_message",
      message: `Use ${res.otp} to log in to your {{APP_NAME}} account. This code will expire in {{VALIDITY_DURATION}} minutes. Keep it secure.`,
      timestamp: Date.now(),
    };

    const conversation = useConversationStore.getState().conversations.find((c) => c.host === "system")!;
    const conversationId = conversation.id!;

    setMessageStore(conversationId, [message as IMessage]);
    updateConversation(conversationId, { recentMessage: message as IMessage, updatedAt: Date.now() });
  };

  //senders///////////////////////////
  const sendOTPVerificationRequest = (userId: string) => {
    otp_socket.auth = { OTP_REQUEST: true };
    otp_socket.connect();
    otp_socket.emit("OTP_REQUEST", { userId }, () => {
      otp_socket.disconnect();
    });
  };

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
    const selectedUser = conversation.members.find((m) => m.id === userId);
    socket.emit("USER_MAKE_ADMIN", { conversation, userId }, (res: any) => {
      toast.success(`${selectedUser?.username} is now an admin`);
    });
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

  const sendGroupjoinRequest = (group: IGroup, user: IUser, conversationExist = false) => {
    socket.emit("JOIN_GROUP", { group, user, conversationExist });
  };

  const leaveGroup = (conversation: IGroupConversation, user: IUser) => {
    socket.emit("LEAVE_GROUP", { conversation, user });
  };

  const findGroupById = (conversationId: string) => {
    socket.emit("GROUP_FIND_BY_ID", conversationId);
  };

  const sendMessage = (conversation: IConversation, messages: IMessage[]) => {
    if (conversation.host === "system") return;
    let conversationId = conversation.conversationId!;
    let receivers;

    messages.forEach((m) => {
      if (m.message) m.message = encrypt(m.message);
    });

    if (conversation.host === "user") {
      if (conversation.blockedByUser) {
        receivers = [];
        messages = messages.map((m) => ({ ...m, to: "" }));
      } else {
        receivers = conversation?.members.map(({ id }) => id);
      }
    } else if (conversation.host === "group") receivers = conversation.channelId;

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
    socket.emit("request:delete_message_for_user", req, handleDeletingMessageForUser);
  };

  const sendGroupCreationRequest = (req: IGroupCreationReq) => {
    socket.emit("create group", req);
  };

  const sendUserBlockRequest = ({ conversation, userConversation }: IUserBlockRequest) => {
    socket.emit("UPDATE_USER_BLOCK_STATUS", { userConversation, conversation, value: true });
  };

  const sendUserUnBlockRequest = (userConversation: IUserConversation) => {
    socket.emit("UPDATE_USER_BLOCK_STATUS", { userConversation, value: false });
  };

  const updateUserInfo = (req: { userId: string; updates: Partial<IUser> }) => {
    socket.emit("UPDATE_USER", req);
  };

  type RuleReq = { userId: string; updates: { rules: Partial<IUser["rules"]> } };

  const sendUserRuleChangeRequest = (req: RuleReq) => {
    const channels = getSocketChannels();
    socket.emit("UPDATE_USER_RULE", req, channels, handleUpdatingUserRule);
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
    const { clearChat, clearUnreadMessages } = useMessageStore.getState();

    clearChat(id);
    clearUnreadMessages(id);
    deleteConversation(id);
    setSelectedConversation(null);
  }

  function getSocketChannels() {
    const users = useStore.getState().users.map((u) => u.id);
    const groupMembers = useConversationStore.getState().conversations.reduce<Set<string>>((i, c) => {
      if (c.host !== "system") c.members.forEach((m) => i.add(m.id));
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
    const id = useConversationStore
      .getState()
      .conversations.find((c) => c.host !== "system" && c.conversationId === conversationId)?.id!;
    updateReadReceipt(id, updates);
  };

  return {
    sendMessage,
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
    sendOTPVerificationRequest,
  };
};

type ISocketContext = ReturnType<typeof useContextData>;

const SocketContext = createContext<ISocketContext | null>(null);

export const SocketProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const data = useContextData();
  return <SocketContext.Provider value={data}>{children}</SocketContext.Provider>;
};

const useSocket = (): ISocketContext => {
  const context = useContext(SocketContext)!;
  if (!context) throw new Error(`Context not found`);
  return context;
};

export default useSocket;
