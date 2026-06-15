"use client";

import React, { createContext, PropsWithChildren, useContext, useEffect, useMemo, useRef } from "react";
import useAuth from "../hooks/useAuth";
import socket from "../lib/ws";
import { useMessageStore } from "../store/messageStore";
import { useStore } from "../store/global";
import { useConversationStore } from "../store/conversationStore";
import { IGroupConversation, IGroupMember, IConversationBase } from "@repo/interfaces/conversationInterface";
import {
  IDeleteResponse,
  IMessage,
  IReadReceiptUpdatesCollection,
  ISystemMessage,
  MessageReadReceipt,
  IReencryptRequest,
  IReencryptResponse,
} from "@repo/interfaces/messageInterface";
import { IUser, IUserRuleChangeRequest } from "@repo/interfaces/userInterface";
import { registerMessages, findPlaintextMessage } from "@lib/messages";
import { decryptMessage, encryptMessage, E2E_WAITING_MESSAGE, resolvePublicKeyForTimestamp } from "@lib/e2e";
import { useE2eeStore } from "store/e2eStore";
import { getReceiverMetadata, getUserFromMetadata, getConversationByConversationId } from "@lib/conversation";
import useIndexedDb from "@lib/idb";
import { useSessionStore } from "store/sessionStore";
import { usePersistentStore } from "store/persistentStore";
import { ISession } from "@repo/interfaces/sessionInterface";
import { IUserConversation } from "@interfaces/conversationInterface";
import { initGroupEmitters } from "@lib/emiters/groupEmiters";
import { initConversationEmiters } from "@lib/emiters/conversationEmiters";
import { messageEmitters } from "@lib/emiters/messageEmitters";
import { userEmitters } from "@lib/emiters/userEmitters";
import { useSession } from "next-auth/react";
import axiosClient from "@lib/axiosClient";

declare global {
  interface Map<K, V> {
    upsert: (key: { conversationId: string; to: string }, value: IReadReceiptUpdatesCollection) => Map<K, V>;
  }
}

Map.prototype.upsert = function (key, value) {
  this.has(key) ? this.get(key)?.push(value) : this.set(key, [value]);
  return this;
};

const { setConversation, updateConversation, setSelectedConversation, deleteConversation } =
  useConversationStore.getState().conversationActions;
const { updateUserStatus, updateUserRule } = useStore.getState();

const {
  setAdmin,
  updateGroupConversation,
  addMembers,
  removeMember,
  addGroupTag: _addGroupTag,
  removeGroupTag: _removeGroupTag,
} = useConversationStore.getState().groupActions;
const { addNewUser, setUsers } = useStore.getState();
const setMessageStore = useMessageStore.getState().setMessageStore;
const updateUserMessages = useMessageStore.getState().updateUserMessages;
const updateReadReceipt = useConversationStore.getState().conversationActions.updateReadReceipt;

const useContextData = () => {
  const { user, updateSession, signOut } = useAuth();
  const { update } = useSession();
  const userRef = useRef<IUser | null>(null);

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
    const updateSyncCheckpoint = (timestamp?: number) => {
      if (!timestamp) return;
      const { syncToken, setSyncToken, clockSkew } = usePersistentStore.getState();
      const estimatedServerTime = Date.now() + clockSkew;

      if (timestamp > syncToken && timestamp <= estimatedServerTime + 5000) {
        setSyncToken(timestamp);
      }
    };

    function onUserConnected({ userId }: { userId: string }) {
      updateUserStatus(userId, "online");
    }

    function onUserDisconnected({ userId, lastSeen }: { userId: string; lastSeen: number }) {
      updateUserStatus(userId, "offline", lastSeen);
    }

    function onNewUserCreated(user: IUser) {
      addNewUser(user);
    }

    function onUserStatus({
      userId,
      status,
      lastSeen,
    }: {
      userId: string;
      status: "online" | "offline";
      lastSeen: number;
    }) {
      updateUserStatus(userId, status, lastSeen);
    }

    async function onMessageReceive(params: { messages: IMessage[]; conversationId: string }) {
      const isSelectedConversation = params.conversationId === socket.selectedConversation?.conversationId;

      const res = await registerMessages({ ...params, isSelectedConversation });

      if (!res) return;

      const { recentMessage, conversation, failedDecryptionMessageIds } = res;

      if (failedDecryptionMessageIds && failedDecryptionMessageIds.length > 0) {
        useMessageStore.getState().addWaitingDecryptionIds(failedDecryptionMessageIds);
      }

      if (failedDecryptionMessageIds && failedDecryptionMessageIds.length > 0 && conversation.host === "user") {
        const otherMember = conversation.members.find((m) => m.userId !== conversation.userId);
        const myPublicKey = useE2eeStore.getState().myPublicKeyJwk;

        if (otherMember && myPublicKey) {
          const { pendingReencryptRequests, addPendingReencrypt } = useE2eeStore.getState();
          const newFailedIds = failedDecryptionMessageIds.filter((id) => !pendingReencryptRequests.has(id));

          if (newFailedIds.length > 0) {
            addPendingReencrypt(newFailedIds);
            emitters.requestReencrypt({
              messageIds: newFailedIds,
              conversationId: conversation.conversationId!,
              requesterPublicKey: myPublicKey,
              requesterId: userRef.current?.id!,
              targetUserId: otherMember.userId,
            });
          }
        }
      }

      const conversationId = conversation.id;
      const conversationUpdates = { recentMessage, updatedAt: recentMessage?.timestamp };

      if (!res.conversation.active) {
        emitters.sendConversationActivationRequest(conversationId);
        updateConversation(conversationId, { ...conversationUpdates, active: true });
      } else updateConversation(conversationId, conversationUpdates);

      if (recentMessage?.timestamp) {
        updateSyncCheckpoint(recentMessage.timestamp);
      }

      if (recentMessage?.from !== userRef.current?.id) {
        const receiptChangeRequest: MessageReadReceipt = isSelectedConversation
          ? {
              conversationId: conversation.conversationId,
              userId: userRef.current?.id!,
              senderId: recentMessage?.from!,
              lastDeliveredMessageTimestamp: Date.now(),
              lastReadMessageTimestamp: Date.now(),
              updatedAt: Date.now(),
            }
          : {
              conversationId: conversation.conversationId,
              userId: userRef.current?.id!,
              senderId: recentMessage?.from!,
              lastDeliveredMessageTimestamp: Date.now(),
              updatedAt: Date.now(),
            };

        emitters.sendReadReceiptChangeRequest([receiptChangeRequest]);
      }

      if (!isSelectedConversation) {
        let receiver = { id: "", displayName: "", icon: "" };

        if (conversation.host === "user") {
          const member = getUserFromMetadata(getReceiverMetadata(conversation)!);

          if (!member) return;
          receiver.id = member.id;
          receiver.displayName = member.username;
          receiver.icon = !member.rules?.includes("hide_profilepicture") ? member.profilePicture : "";
        } else if (conversation.host === "group") {
          receiver.id = conversation.id!;
          receiver.displayName = conversation.displayName!;
          receiver.icon = conversation.profilePicture;
        }

        if (!receiver.id) return;

        const text = recentMessage?.message!;
        const notificationPermissionGranted = Notification.permission === "granted";
        let canSendNotification =
          (conversation.host === "group" || conversation.host === "user") && userNotificationPref[conversation.host];
        let notificationDisabledForConversation = await idb.get(receiver.id);

        notificationPermissionGranted &&
          canSendNotification &&
          !notificationDisabledForConversation &&
          sendBrowserNotification(text, receiver.displayName, receiver.icon);
      }
    }

    function onReadReceiptChangeRequest(req: MessageReadReceipt) {
      updateReadReceipt(req);
      if (req.updatedAt) {
        updateSyncCheckpoint(req.updatedAt);
      }
    }

    function handleUpdatingBlockStatus(conversationId: string, updates: Partial<IUserConversation>) {
      const conversation = useConversationStore
        .getState()
        .conversations.find((c) => c.host === "user" && c.conversationId === conversationId);

      updateConversation(conversation?.id!, updates);
    }

    function handleDeletingMessageForAll({ conversationId, messages }: IDeleteResponse) {
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
    }

    function handleCreatingGroup(conversation: IGroupConversation, users: IUser[], self: boolean) {
      const groupMemberEntries = new Map(users.map((member) => [member.id, member]));

      setUsers(groupMemberEntries);
      setConversation(conversation);

      if (conversation.updatedAt) {
        updateSyncCheckpoint(conversation.updatedAt);
      }

      if (self) {
        setSelectedConversation(conversation.id);
        socket.selectedConversation = conversation;
      }
    }

    function handleUpdatingGroup({ id, ...updates }: IGroupConversation, systemMessage: IMessage) {
      const conversationId = useConversationStore
        .getState()
        .conversations.find((c) => c.host === "group" && c.conversationId === id)?.id!;

      if (systemMessage) setMessageStore(conversationId, [systemMessage]);

      updateGroupConversation(conversationId, updates);

      if (updates.updatedAt) {
        updateSyncCheckpoint(updates.updatedAt);
      }
    }

    function handleAddingMembersToGroup(
      {
        conversationId,
        members,
        users,
      }: {
        conversationId: string;
        members: IGroupMember[];
        users: IUser[];
      },
      systemMessages: IMessage[],
    ) {
      const existingConversation = useConversationStore
        .getState()
        .conversations.find((c) => c.host === "group" && c.conversationId === conversationId);

      if (existingConversation) {
        const groupMemberEntries = new Map(users.map((member) => [member.id, member]));
        addMembers(conversationId, members);
        setUsers(groupMemberEntries);
        if (systemMessages) setMessageStore(existingConversation.id, systemMessages);
      }
    }

    function handleRemovingMemberFromGroup(
      { conversationId, userId }: { conversationId: string; userId: string },
      systemMessages: IMessage[],
    ) {
      const id = useConversationStore
        .getState()
        .conversations.find((c) => c.host === "group" && c.conversationId === conversationId)?.id!;

      if (!!systemMessages.length) setMessageStore(id, systemMessages);

      removeMember(id, userId);
    }

    function handleDeletingConversation(conversationId: string) {
      updateConversation(conversationId, { active: false, archived: false });
      useMessageStore.getState().clearChat(conversationId);
    }

    function handleUpdatingConversation(conversationId: string, update: Partial<IConversationBase>) {
      updateConversation(conversationId, update);
      if (update.updatedAt) {
        updateSyncCheckpoint(update.updatedAt);
      }
    }

    async function handleCreatingUserConversation(conversation: IUserConversation, user: IUser, select: boolean) {
      addNewUser(user);

      try {
        const res = await axiosClient.get(`/db/user/key-history/${user.id}`);
        useStore.getState().updateUserFields(user.id, { publicKeyHistory: res.data });
      } catch (err) {
        console.error("Failed to fetch public key history for new contact:", err);
      }

      setConversation({
        ...conversation,
        readReceipt: {
          [userRef.current!.id]: {
            conversationId: conversation.id,
            userId: userRef.current!.id,
            lastDeliveredMessageTimestamp: Date.now(),
            senderId: user.id,
            updatedAt: Date.now(),
          },
        },
      });

      if (conversation.updatedAt) {
        updateSyncCheckpoint(conversation.updatedAt);
      }

      if (select) {
        setSelectedConversation(conversation.id);
        socket.selectedConversation = conversation;
      }
    }

    function handleAddingGroupTag(
      {
        groupId,
        tag,
      }: {
        groupId: string;
        tag: string;
      },
      systemMessages: IMessage[],
    ) {
      const conversations = useConversationStore.getState().conversations;

      const id = conversations.find((c) => c.host === "group" && c.conversationId === groupId)?.id!;
      _addGroupTag(id, tag);
      if (systemMessages) setMessageStore(id, systemMessages);
    }

    function handleRemovingGroupTag(
      {
        groupId,
        tag,
      }: {
        groupId: string;
        tag: string;
      },
      systemMessages: IMessage[],
    ) {
      const conversations = useConversationStore.getState().conversations;

      const id = conversations.find((c) => c.host === "group" && c.conversationId === groupId)?.id!;
      _removeGroupTag(id, tag);
      if (systemMessages) setMessageStore(id, systemMessages);
    }

    async function handleSavingSession(session: ISession) {
      const currentSession = useSessionStore.getState().currentSession;
      const activeSessions = useSessionStore.getState().activeSessions;

      const self = currentSession?.sessionId === session.sessionId;

      if (self) return;
      if (!activeSessions.some((s) => s.sessionId === session.sessionId)) {
        useSessionStore.getState().actions.addSession(session);
      }
    }

    async function handleRemovingSession(expiredSessionIds: string[]) {
      const currentSession = useSessionStore.getState().currentSession;
      if (expiredSessionIds.includes(currentSession?.sessionId!)) {
        await signOut();
      }
    }

    function handleOTPMessage(res: any) {
      const message: ISystemMessage = {
        id: crypto.randomUUID(),
        conversationId: "system",
        to: userRef.current?.id,
        from: "system",
        type: "service_message",
        message: `Use ${res.otp} to log in to your {{APP_NAME}} account. This code will expire in {{VALIDITY_DURATION}} minutes. Keep it secure.`,
        timestamp: Date.now(),
      };

      const conversation = useConversationStore.getState().conversations.find((c) => c.host === "system")!;
      const conversationId = conversation.id!;

      setMessageStore(conversationId, [message as IMessage]);
      updateConversation(conversationId, { recentMessage: message as IMessage, updatedAt: Date.now() });
    }

    function handleClearingConversation(conversationId: string) {
      useMessageStore.getState().clearChat(conversationId);
      updateConversation(conversationId, { recentMessage: null });
    }

    function handleRegisteringStarredMessages(conversationId: string, chat: IMessage, action: "add" | "remove") {
      if (action === "add") useConversationStore.getState().conversationActions.addToStarred(conversationId, chat);
      else useConversationStore.getState().conversationActions.removeFromStarred(conversationId, chat.id);
    }

    async function handleChangeUserRule({ userId, rule }: IUserRuleChangeRequest) {
      const user = userRef.current;
      if (!user) return;

      if (userId === user.id) {
        const hasRule = user.rules?.includes(rule);
        let newRules = hasRule ? user.rules?.filter((r) => r !== rule)! : [...(user.rules || []), rule];

        const updates = { ...user, rules: newRules };

        await updateSession(updates);
        return;
      }

      updateUserRule(userId, rule);
    }

    function onUserPublicKeyUpdate({
      userId,
      publicKey,
      publicKeyHistory,
    }: {
      userId: string;
      publicKey: string;
      publicKeyHistory?: any[];
    }) {
      useStore.getState().updateUserFields(userId, {
        publicKey,
        ...(publicKeyHistory ? { publicKeyHistory } : {}),
      });
    }

    function handleDeletingGroupConversation(conversationId: string) {
      clearConversationData(conversationId);
    }

    function handleJoiningGroup(
      conversation: IGroupConversation,
      users: IUser[],
      systemMessages: IMessage[],
      self = false,
    ) {
      const { id, conversationId, members } = conversation;
      const existingConversation = useConversationStore
        .getState()
        .conversations.find((c) => c.conversationId === conversationId);

      if (existingConversation) {
        const cid = existingConversation.id;
        updateGroupConversation(cid, { members });
        if (self) {
          setSelectedConversation(cid);
          socket.selectedConversation = existingConversation;
        }
        setMessageStore(cid, systemMessages);
      } else {
        const groupMemberEntries = new Map(users.map((member) => [member.id, member]));

        setUsers(groupMemberEntries);
        setConversation(conversation);
        setMessageStore(id, systemMessages);
      }

      if (conversation.updatedAt) {
        updateSyncCheckpoint(conversation.updatedAt);
      }

      useStore.getState().setDeviceTab("chatarea");
    }

    async function onRequestReencrypt(request: IReencryptRequest) {
      const myPrivateKey = useE2eeStore.getState().myPrivateKeyJwk;
      if (!myPrivateKey) return;

      const reencryptedMessages: { id: string; message: string; publicKeyTimestamp?: number }[] = [];
      const now = Date.now();
      for (const msgId of request.messageIds) {
        const plaintext = findPlaintextMessage(msgId, request.conversationId);

        if (plaintext) {
          const newCiphertext = await encryptMessage(plaintext, request.requesterPublicKey, myPrivateKey);
          reencryptedMessages.push({ id: msgId, message: newCiphertext, publicKeyTimestamp: now });
        }
      }

      if (reencryptedMessages.length > 0) {
        let publicKeyHistory;
        try {
          const res = await axiosClient.get(`/db/user/key-history/${userRef.current?.id}`);
          publicKeyHistory = res.data;
        } catch (err) {
          console.error("Failed to fetch own publicKeyHistory for reencrypt response:", err);
        }

        socket.emit("REENCRYPT_RESPONSE", {
          messages: reencryptedMessages,
          conversationId: request.conversationId,
          targetUserId: request.requesterId,
          publicKeyHistory,
        });
      } else {
        console.log("No plaintext messages found for reencryption");
      }
    }

    async function onReencryptResponse(response: IReencryptResponse) {
      console.log("reencrypt response");
      const conversation = getConversationByConversationId(response.conversationId);
      if (!conversation) return;

      const otherMember = (conversation as IUserConversation).members.find((m) => m.userId !== conversation.userId);
      const otherUser = otherMember ? useStore.getState().users.get(otherMember.userId) : null;
      const myPrivateKey = useE2eeStore.getState().myPrivateKeyJwk || undefined;
      const decryptedUpdates: IMessage[] = [];
      const failedDecryptions: {
        messageId: string;
        conversationId: string;
        requesterId: string;
        otherPublicKey?: string;
        encryptedContent: string;
        reason: string;
      }[] = [];

      if (otherMember && response.publicKeyHistory?.length) {
        useStore.getState().updateUserFields(otherMember.userId, {
          publicKeyHistory: response.publicKeyHistory,
        });
      }

      for (const m of response.messages) {
        let otherPublicKey: string | undefined = undefined;

        try {
          otherPublicKey = resolvePublicKeyForTimestamp(
            response.publicKeyHistory,
            otherUser?.publicKey,
            m.publicKeyTimestamp!,
          );

          const decryptedText = await decryptMessage(m.message, otherPublicKey, myPrivateKey);

          if (decryptedText !== E2E_WAITING_MESSAGE) {
            decryptedUpdates.push({
              id: m.id,
              message: decryptedText,
              publicKeyTimestamp: m.publicKeyTimestamp,
            } as IMessage);

            useE2eeStore.getState().removePendingReencrypt([m.id]);
            useMessageStore.getState().removeWaitingDecryptionIds([m.id]);
          } else {
            failedDecryptions.push({
              messageId: m.id,
              conversationId: response.conversationId,
              requesterId: userRef.current?.id ?? "",
              otherPublicKey,
              encryptedContent: m.message,
              reason: "decryption_returned_waiting_message",
            });
          }
        } catch (err) {
          console.error(`Reencrypt decryption error for message ${m.id}:`, err);
          failedDecryptions.push({
            messageId: m.id,
            conversationId: response.conversationId,
            requesterId: userRef.current?.id ?? "",
            otherPublicKey,
            encryptedContent: m.message,
            reason: err instanceof Error ? err.message : "unknown_decryption_error",
          });
        }
      }

      if (decryptedUpdates.length > 0) {
        useMessageStore.getState().updateUserMessages(conversation.id, decryptedUpdates);

        if (conversation.recentMessage) {
          const matchingUpdate = decryptedUpdates.find((u) => u.id === conversation.recentMessage?.id);
          if (matchingUpdate) {
            updateConversation(conversation.id, {
              recentMessage: {
                ...conversation.recentMessage,
                message: matchingUpdate.message,
              },
            });
          }
        }
      }

      if (failedDecryptions.length > 0) {
        console.warn("Reencryption failures detected, persisting for debugging:", failedDecryptions);
        socket.emit("SAVE_FAILED_REENCRYPTIONS", { failures: failedDecryptions });
      }
    }

    socket.on("REQUEST_REENCRYPT", onRequestReencrypt);
    socket.on("REENCRYPT_RESPONSE", onReencryptResponse);
    socket.on("USER_CONNECTED", onUserConnected);
    socket.on("user disconnected", onUserDisconnected);
    socket.on("UPDATE_USER_PUBLIC_KEY", onUserPublicKeyUpdate);

    socket.on("new user created", onNewUserCreated);
    socket.on("message receive", onMessageReceive);
    socket.on("change readReceipt", onReadReceiptChangeRequest);
    socket.on("request:delete_message", handleDeletingMessageForAll);
    socket.on("UPDATE_USER_BLOCK_STATUS", handleUpdatingBlockStatus);

    socket.on("group created", handleCreatingGroup);
    socket.on("GROUP_ADD_MEMBERS", handleAddingMembersToGroup);
    socket.on("GROUP_REMOVE_MEMBER", handleRemovingMemberFromGroup);
    socket.on("JOIN_GROUP", handleJoiningGroup);
    socket.on("UPDATE_GROUP", handleUpdatingGroup);
    socket.on("SET_GROUP_ADMIN", setAdmin);
    socket.on("DELETE_CONVERSATION", handleDeletingConversation);
    socket.on("CREATE_USER_CONVERSATION", handleCreatingUserConversation);
    socket.on("UPDATE_CONVERSATION", handleUpdatingConversation);
    socket.on("ADD_GROUP_TAG", handleAddingGroupTag);
    socket.on("REMOVE_GROUP_TAG", handleRemovingGroupTag);
    socket.on("CLEAR_CONVERSATION", handleClearingConversation);
    socket.on("REGISTER_STARRED_MESSAGES", handleRegisteringStarredMessages);
    socket.on("UPDATE_USER_RULE", handleChangeUserRule);
    socket.on("DELETE_GROUP_CONVERSATION", handleDeletingGroupConversation);

    socket.on("SAVE_SESSION", handleSavingSession);
    socket.on("END_SESSION", handleRemovingSession);
    socket.on("OTP_MESSAGE", handleOTPMessage);
    socket.on("USER_STATUS", onUserStatus);

    return () => {
      socket.off("REQUEST_REENCRYPT", onRequestReencrypt);
      socket.off("REENCRYPT_RESPONSE", onReencryptResponse);
      socket.off("USER_CONNECTED", onUserConnected);
      socket.off("new user created", onNewUserCreated);
      socket.off("user disconnected", onUserDisconnected);
      socket.off("UPDATE_USER_PUBLIC_KEY", onUserPublicKeyUpdate);
      socket.off("message receive", onMessageReceive);
      socket.off("change readReceipt", onReadReceiptChangeRequest);
      socket.off("request:delete_message");
      socket.off("UPDATE_USER_BLOCK_STATUS", handleUpdatingBlockStatus);

      socket.off("group created", handleCreatingGroup);
      socket.off("GROUP_ADD_MEMBERS", handleAddingMembersToGroup);
      socket.off("GROUP_REMOVE_MEMBER", handleRemovingMemberFromGroup);
      socket.off("JOIN_GROUP", handleJoiningGroup);
      socket.off("UPDATE_GROUP", handleUpdatingGroup);
      socket.off("SET_GROUP_ADMIN", setAdmin);
      socket.off("DELETE_CONVERSATION", handleDeletingConversation);
      socket.off("CREATE_USER_CONVERSATION", handleCreatingUserConversation);
      socket.off("UPDATE_CONVERSATION", handleUpdatingConversation);
      socket.off("ADD_GROUP_TAG", handleAddingGroupTag);
      socket.off("REMOVE_GROUP_TAG", handleRemovingGroupTag);
      socket.off("CLEAR_CONVERSATION", handleClearingConversation);
      socket.off("REGISTER_STARRED_MESSAGES", handleRegisteringStarredMessages);
      socket.off("UPDATE_USER_RULE", handleChangeUserRule);
      socket.off("DELETE_GROUP_CONVERSATION", handleDeletingGroupConversation);

      socket.on("SAVE_SESSION", handleSavingSession);
      socket.off("END_SESSION", handleRemovingSession);
      socket.off("OTP_MESSAGE", handleOTPMessage);
      socket.off("USER_STATUS", onUserStatus);
    };
  }, [update]);

  const clearConversationData = (id: string) => {
    const { clearChat, clearUnreadMessages } = useMessageStore.getState();

    clearChat(id);
    clearUnreadMessages(id);
    deleteConversation(id);
    setSelectedConversation(null);
  };

  const disconectSocket = () => {
    socket?.disconnect();
  };

  function sendBrowserNotification(message: string, username: string, icon: string) {
    if (Notification.permission === "granted") {
      new Notification(`New message from ${username}`, {
        body: message,
        icon,
      });
    }
  }

  const registerChannels = (channels: string[]) => {
    socket.emit("REGISTER_CHANNELS", channels);
  };

  const emitters = useMemo(() => {
    return {
      disconectSocket,
      registerChannels,
      ...initGroupEmitters(socket, user!),
      ...initConversationEmiters(socket, user!),
      ...messageEmitters(socket),
      ...userEmitters(socket, user!),
    };
  }, [user]);

  return emitters;
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
