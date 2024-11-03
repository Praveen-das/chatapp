"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
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
} from "../interfaces/conversationInterface";
import {
  IAttachment,
  IDeleteResponse,
  IImageAttachment,
  IImagePayload,
  IMessage,
  IUnreadMessageMeta,
  IUpdates,
  IUpdatesCollection,
} from "../interfaces/messageInterface";
import { IBlocked, IUser } from "../interfaces/userInterface";
import { IGroupCreationReq } from "../interfaces/groupInterface";
import { processMessagesForUser } from "@lib/messages";

declare global {
  interface Map<K, V> {
    upsert: (
      key: { conversationId: string; to: string },
      value: IUpdatesCollection
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
  const updateUserRule = useStore((s) => s.updateUserRule);

  const [blockedUsers, setBlockedUsers] = useState<IBlocked[]>([]);

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
  const setMediaStore = useAttachments((s) => s.setMediaStore);
  const updateUserStatus = useStore((s) => s.updateUserStatus);

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
    socket.on("RESPONSE:BLOCK_USER", handleBlockingUser);
    socket.on("RESPONSE:UNBLOCK_USER", handleUnBlockingUser);
    socket.on("updateUserRule", handleUpdatingUserRule);

    socket.on("group created", handleCreatingGroup);
    socket.on("GROUP_ADD_MEMBERS", handleAddingMembersToGroup);
    socket.on("GROUP_REMOVE_MEMBER", handleRemovingMemberFromGroup);
    socket.on("UPDATE_GROUP", handleUpdatingGroup);
    socket.on("SET_GROUP_ADMIN", handleSettingGroupAdmin);
    socket.on("DELETE_CONVERSATION", handleDeletingConversation);
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
      socket.off("RESPONSE:BLOCK_USER", handleBlockingUser);
      socket.off("RESPONSE:UNBLOCK_USER", handleUnBlockingUser);
      socket.off("updateUserRule", handleUpdatingUserRule);

      socket.off("group created", handleCreatingGroup);
      socket.off("GROUP_ADD_MEMBERS", handleAddingMembersToGroup);
      socket.off("GROUP_REMOVE_MEMBER", handleRemovingMemberFromGroup);
      socket.off("UPDATE_GROUP", handleUpdatingGroup);
      socket.on("SET_GROUP_ADMIN", handleSettingGroupAdmin);
      socket.off("DELETE_CONVERSATION", handleDeletingConversation);
      socket.on("UPDATE_CONVERSATION", handleUpdatingConversation);
    };
  }, []);

  // receivers///////////////////////////

  const onReceiveConnectedUsers = async ({
    contacts,
    conversations,
    blockedUsers = [],
  }: {
    contacts: IUser[];
    blockedUsers: IBlocked[];
    conversations: IUserConversation[];
  }) => {
    registerConversations(conversations);

    setUsers(contacts);

    setBlockedUsers(blockedUsers);
  };

  const onUserConnected = ({ userId }: { userId: string }) => {
    updateUserStatus(userId, "online");
  };

  const onUserDisconnected = ({
    userId,
    lastSeen,
  }: {
    userId: string;
    lastSeen: number;
  }) => {
    updateUserStatus(userId, "offline", lastSeen);
  };

  const onNewUserCreated = (user: IUser) => {
    addNewUser(user);
  };

  async function onMessageReceive({
    messages: _messages,
    conversation,
  }: {
    messages: IMessage[];
    conversation: IUserConversation;
  }) {
    const conversationId = conversation.id!;
    const currentUser = conversationId === socket.selectedConversation?.id;
    const updatesCollection: IUpdates = new Map();

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
    conversation.recentMessage = recentMessage!;
    
    if (!!updates.length) {
      updates.forEach(({ key, value }) => {
        updatesCollection.upsert(key, value);
      });
    }

    if (conversation.unsaved) {
      delete conversation.unsaved;
      setConversation(conversation);
    } else {
      updateConversation(conversationId, { recentMessage });
    }

    setMediaStore(conversationId, mediaStore);
    setUnreadMessages(conversationId, unreadMessages);
    setMessageStore(conversationId, messages);
    sendReadReceiptChangeRequest(updatesCollection);

    if (!currentUser) sendBrowserNotification(recentMessage!);
  }

  const handleBlockingUser = (req: IBlocked) => {
    setBlockedUsers((s) => [req, ...s]);
  };

  const handleUnBlockingUser = (req: IBlocked) => {
    setBlockedUsers((s) => s.filter((m) => m.id !== req.id));
  };

  const handleDeletingMessageForAll = ({
    conversationId,
    messages,
  }: IDeleteResponse) => updateUserMessages(conversationId, messages);

  const handleDeletingMessageForUser = ({
    conversationId,
    collection,
  }: IDeleteForUserRequest) => deleteUserMessages(conversationId, collection);

  const handleCreatingGroup = (group: IUserConversation) => {
    setConversation(group);
  };

  const onSessionReceived = (sessionId: string) => {
    console.log("sessionId", sessionId);

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

    updateUserRule(userId, rules);
  };

  const handleUpdatingGroup = (
    conversation: IGroupConversation,
    systemMessage: IMessage
  ) => {
    if (systemMessage) setMessageStore(conversation.id, [systemMessage]);
    updateGroupConversation(conversation.id, conversation);
  };

  const handleAddingMembersToGroup = (
    {
      conversation,
      members,
    }: { conversation: IGroupConversation; members: IGroupMember[] },
    systemMessages: IMessage[]
  ) => {
    if (systemMessages) setMessageStore(conversation.id, systemMessages);

    const conversations = useConversationStore.getState().conversations;

    if (conversations.find((c) => c.id === conversation.id))
      addMembers(conversation.id, members);
    else {
      registerConversations([conversation]);
    }
  };

  const handleRemovingMemberFromGroup = (
    { id, userId }: { id: string; userId: string },
    systemMessages: IMessage[]
  ) => {
    if (systemMessages) setMessageStore(id, systemMessages);
    removeMember(id, userId, userId === userRef.current?.id);
  };

  const handleDeletingConversation = ({
    conversationId,
    userId,
  }: {
    conversationId: string;
    userId: string;
  }) => {
    const deleteConversation =
      useConversationStore.getState().deleteConversation;
    deleteConversation(conversationId, userId);
  };

  const handleSettingGroupAdmin = setAdmin;

  const handleUpdatingConversation = (conversationId:string,update:Partial<IConversationBase>)=>{
    const updateConversation = useConversationStore.getState().updateConversation
    updateConversation(conversationId,update)
  }

  //senders///////////////////////////

  const sendRequestToArchiveConversation = (conversationId: string) => {
    socket.emit("ARCHIVE_CONVERSATION", conversationId);
  };
  
  const sendRequestToUnarchiveConversation = (conversationId: string) => {
    socket.emit("UNARCHIVE_CONVERSATION", conversationId);
  };

  const sendRequestToClearUserConversation = (
    req: IClearConversationRequest
  ) => {
    socket.emit("CLEAR_CONVERSATION", req);
  };

  const sendRequestToClearGroupConversation = (
    req: IClearConversationRequest
  ) => {
    socket.emit("CLEAR_GROUP_CONVERSATION", req);
  };

  const sendConversationDeleteRequest = (req: IDeleteConversationRequest) => {
    socket.emit("DELETE_CONVERSATION", req);
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
    members: string[]
  ) => {
    socket.emit("GROUP_ADD_MEMBERS", { conversation, members });
  };

  const sendGroupjoinRequest = (
    conversation: IGroupConversation,
    user: IUser
  ) => {
    socket.emit("GROUP_JOIN", { conversation, user });
  };

  const leaveGroup = (conversation: IGroupConversation, user: IUser) => {
    socket.emit("GROUP_LEAVE", { conversation, user });
  };

  const findGroupById = (conversationId: string) => {
    socket.emit("GROUP_FIND_BY_ID", conversationId);
  };

  const sendMessage = (
    messages: IMessage[],
    _conversation: IUserConversation | IGroupConversation
  ) => {
    let conversation = { ..._conversation };
    if (_conversation.host === "user") {
      const receiver = conversation.members.find(
        (m) => m.id !== userRef.current?.id
      );
      const blockedByUser = blockedUsers.some(
        ({ user }) => user.id === receiver?.id
      );

      if (blockedByUser) {
        messages.forEach((message) => Object.assign(message, { to: "" }));

        Object.assign(conversation, {
          members: conversation.members.filter(
            (m) => m.id === userRef.current?.id
          ),
        });
      }
    }

    socket?.emit("message", { messages, conversation });
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

  const sendUserBlockRequest = (req: IBlocked) => {
    socket.emit("REQUEST:BLOCK_USER", req);
  };

  const sendUserUnBlockRequest = (req: IBlocked) => {
    socket.emit("REQUEST:UNBLOCK_USER", req);
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

    conversations.forEach((conversation, i) => {
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

      if (conversation.host === "user")
        conversation.displayName = conversation.members.find(
          (m) => m.id !== userRef.current?.id
        )?.username;

      if (!!updates.length) {
        updates.forEach(({ key, value }) => {
          updatesCollection.upsert(key, value);
        });
      }

      const mediaStore = { images: imageAttachments, link: urlAttachments };
      conversation.recentMessage = messages?.at(-1);

      setConversation(conversation);

      messageStore.set(conversationId, messages || []);
      setMediaStore(conversationId, mediaStore);
      setUnreadMessages(conversationId, unreadMessages);

      delete conversation.messages;
    });

    setMessageHistory(messageStore);
    !!updatesCollection.size && sendReadReceiptChangeRequest(updatesCollection);
  }

  function sendBrowserNotification(message: IMessage) {
    if (Notification.permission === "granted") {
      new Notification("New message", {
        body: "This is the body of the notification.",
        icon: "path/to/icon.png",
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
    updates: IUpdatesCollection[];
  }) => {
    updateReadReceipt(conversationId, updates);
  };

  return {
    sendMessage,
    connectSocket,
    disconectSocket,
    sendReadReceiptChangeRequest,
    deleteMessageForAll,
    deleteMessagesForUser,
    sendGroupCreationRequest,
    blockedUsers,
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
    sendRequestToClearGroupConversation,
    sendRequestToClearUserConversation,
    sendRequestToArchiveConversation,
    sendRequestToUnarchiveConversation,
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
