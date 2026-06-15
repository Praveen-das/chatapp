"use client";
import { useLoading } from "@features/ui/InitialLoader";
import InitializationError from "@features/ui/InitializationError";
import useAuth from "@hooks/useAuth";
import useAxios from "@hooks/useAxios";
import { IConversation, IUserConversation } from "@interfaces/conversationInterface";
import { IMessage } from "@interfaces/messageInterface";
import { getReceiver, handleSettingGroupAdmin, getConversationByConversationId } from "@lib/conversation";
import { processMessagesForUser, registerMessages, findPlaintextMessage } from "@lib/messages";
import { encryptMessage, decryptMessage, E2E_WAITING_MESSAGE, resolvePublicKeyForTimestamp } from "@lib/e2e";
import { useE2eeStore } from "store/e2eStore";
import socket from "@lib/ws";
import { MessageReadReceipt } from "@repo/interfaces/messageInterface";
import { ISession } from "@repo/interfaces/sessionInterface";
import { ConversationFetchResponse } from "@repo/interfaces/syncRegistryInterface";
import { PropsWithChildren, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useAttachments } from "store/attachments";
import { useConversationStore } from "store/conversationStore";
import { useStore } from "store/global";
import { useMessageStore } from "store/messageStore";
import { useSessionStore } from "store/sessionStore";
import { usePersistentStore } from "store/persistentStore";
import useSocket from "./SocketProvider";
import { IUser } from "@repo/interfaces/userInterface";
import useAccessToken from "@hooks/useAccessToken";

const { setActiveSessions, setCurrentSession } = useSessionStore.getState().actions;
const { setConversations, updateConversation, upsertConversation } =
  useConversationStore.getState().conversationActions;
const { setUnreadMessages, setMessageHistory } = useMessageStore.getState();
const { setMediaStore } = useAttachments.getState();
const { setUsers } = useStore.getState();

type AppPostReq = {
  unsyncConversationsData: Record<keyof ConversationFetchResponse, IConversation[]>;
  unsyncUsersData: Record<string, IUser>;
  unsyncReadReceipts: MessageReadReceipt[];
  syncToken: number;
};

export const AppContext = ({ children }: PropsWithChildren) => {
  const { session, updateSession } = useAuth();
  const { sendReadReceiptChangeRequest, sendPresence, sendConversationActivationRequest, requestReencrypt } =
    useSocket();
  const setIsLoaded = useConversationStore((s) => s.conversationActions.setIsLoaded);
  const axios = useAxios();
  const setModal = useStore((s) => s.setModal);

  const { finishLoading } = useLoading();
  const [syncError, setSyncError] = useState<Error | null>(null);
  const [retryTrigger, setRetryTrigger] = useState(0);

  useEffect(() => {
    (async () => {
      const cookies = document.cookie.split(";").map((c) => c.trim());
      const invitationId = cookies.find((c) => c.startsWith("invitationId"))?.split("=")[1];

      if (invitationId) {
        setModal({
          activeModal: "joinGroupModal",
          state: { invitationId },
          open: true,
        });

        document.cookie = "invitationId=; path=/; max-age=0";
      }
    })();
  }, []);

  useEffect(() => {
    const user = session?.user;

    if (!user?.id) return;

    const conversationController = new AbortController();
    const sessionController = new AbortController();

    function initSessions(sessions: ISession[]) {
      const _sessions = sessions
        .map(
          (s) =>
            s && {
              ...s,
              self: s.sessionId === session?.sessionId,
            },
        )
        .filter((s) => s);

      _sessions.sort((a, b) => {
        if (a.self !== b.self) {
          return Number(b.self) - Number(a.self); // true (1) comes before false (0)
        }
        return b.data.timestamp - a.data.timestamp;
      });

      const [currentSession, ...activeSessions] = _sessions;

      return { currentSession, activeSessions };
    }

    function getSocketMetadata(conversations: IConversation[]) {
      const connections: Set<string> = new Set();
      const channels: string[] = [];

      conversations.forEach((conversation) => {
        if (conversation.host === "group") {
          channels.push(conversation.channelId!);
          connections.add(conversation.channelId!);
        }
        if (conversation.host === "user") {
          const receiver = getReceiver(conversation!)?.id!;
          if (receiver) connections.add(receiver);
        }
      });

      return { connections, channels };
    }

    async function initConversations(conversations: IConversation[]) {
      const messageStore: Map<string, IMessage[]> = new Map();
      const conversationsCollection: IConversation[] = [];
      const readReceiptUpdates: MessageReadReceipt[] = [];

      for (const conversation of conversations) {
        let conversationId = conversation.id;

        const { unreadMessages, aiMessages, messages, imageAttachments, urlAttachments, failedDecryptionMessageIds } =
          await processMessagesForUser(conversation.messages, conversation);

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
              requestReencrypt({
                messageIds: newFailedIds,
                conversationId: conversation.conversationId!,
                requesterPublicKey: myPublicKey,
                requesterId: user?.id!,
                targetUserId: otherMember.userId,
              });
            }
          }
        }

        const mediaStore = { images: imageAttachments, link: urlAttachments };
        const recentMessage = messages?.at(-1);
        const recentAiMessage = aiMessages?.at(-1);

        handleSettingGroupAdmin(conversation);

        if (recentAiMessage) {
          messageStore.set(conversationId, aiMessages || []);
          conversation.recentMessage = recentAiMessage;
        }

        if (recentMessage) {
          if (
            !!unreadMessages.length &&
            (conversation.readReceipt?.[user?.id!]?.lastDeliveredMessageTimestamp || 0) < recentMessage.timestamp &&
            recentMessage?.from !== user?.id &&
            (conversation.host === "user" || conversation.host === "group")
          ) {
            readReceiptUpdates.push({
              conversationId: conversation.conversationId,
              userId: user?.id!,
              senderId: recentMessage?.from!,
              lastDeliveredMessageTimestamp: Date.now(),
              updatedAt: Date.now(),
            });
          }

          if (!conversation.active) {
            conversation.active = true;
            sendConversationActivationRequest(conversationId);
          }

          messageStore.set(conversationId, messages || []);
          conversation.recentMessage = recentMessage;
        }

        delete conversation.messages;

        conversationsCollection.push(conversation);

        setMediaStore(conversationId, mediaStore);
        !!unreadMessages.length && setUnreadMessages(conversationId, unreadMessages);
      }

      readReceiptUpdates.length > 0 && sendReadReceiptChangeRequest(readReceiptUpdates);
      setMessageHistory(messageStore);

      const existingConversations = useConversationStore.getState().conversations;
      if (existingConversations.length === 0) {
        setConversations(conversationsCollection);
      } else {
        upsertConversation(conversationsCollection);
      }
    }

    async function updateMessagesForConversation(messagesCollection: IConversation[]) {
      const readReceiptUpdates: MessageReadReceipt[] = [];

      for (const c of messagesCollection) {
        let conversationId = c.conversationId;
        let userConversationId = c.id;
        const res = await registerMessages({ messages: c.messages!, conversationId });

        if (!res) continue;

        const { recentMessage, failedDecryptionMessageIds } = res;

        if (failedDecryptionMessageIds && failedDecryptionMessageIds.length > 0) {
          useMessageStore.getState().addWaitingDecryptionIds(failedDecryptionMessageIds);
        }

        if (failedDecryptionMessageIds && failedDecryptionMessageIds.length > 0 && res.conversation.host === "user") {
          const otherMember = res.conversation.members.find((m) => m.userId !== res.conversation.userId);
          const myPublicKey = useE2eeStore.getState().myPublicKeyJwk;
          if (otherMember && myPublicKey) {
            const { pendingReencryptRequests, addPendingReencrypt } = useE2eeStore.getState();
            const newFailedIds = failedDecryptionMessageIds.filter((id) => !pendingReencryptRequests.has(id));
            if (newFailedIds.length > 0) {
              addPendingReencrypt(newFailedIds);
              requestReencrypt({
                messageIds: newFailedIds,
                conversationId: res.conversation.conversationId!,
                requesterPublicKey: myPublicKey,
                requesterId: user?.id!,
                targetUserId: otherMember.userId,
              });
            }
          }
        }

        if (recentMessage) {
          readReceiptUpdates.push({
            conversationId: c.conversationId,
            userId: user?.id!,
            senderId: recentMessage?.from!,
            lastDeliveredMessageTimestamp: Date.now(),
            updatedAt: Date.now(),
          });
        }

        if (!res.conversation.active) {
          sendConversationActivationRequest(userConversationId);
          updateConversation(userConversationId, { recentMessage, active: true });
        } else updateConversation(userConversationId, { recentMessage });
      }

      if (readReceiptUpdates.length > 0) {
        sendReadReceiptChangeRequest(readReceiptUpdates);
      }
    }

    async function performDeltaSync(signal?: AbortSignal) {
      try {
        const userId = user?.id;
        const { setSyncToken } = usePersistentStore.getState();
        const storedConversationsCount = useConversationStore.getState().conversations.length;

        const syncToken = storedConversationsCount > 0 ? usePersistentStore.getState().syncToken : 0;

        const unsyncEntries = await axios
          .post<AppPostReq>(`/db/conversation/${userId}`, { syncToken }, { signal })
          .then((res) => res.data);

        const {
          unsyncConversationsData,
          unsyncUsersData,
          unsyncReadReceipts,
          syncToken: newSyncToken,
        } = unsyncEntries || {
          unsyncConversationsData: null,
          unsyncUsersData: null,
          unsyncReadReceipts: null,
          syncToken: 0,
        };

        if (newSyncToken) {
          setSyncToken(newSyncToken);
          const skew = newSyncToken - Date.now();
          usePersistentStore.getState().setClockSkew(skew);
        }

        if (unsyncUsersData && !!Object.values(unsyncUsersData).length) {
          const users = new Map(Object.entries(unsyncUsersData));
          if (users.has(userId!) && users.get(userId!)?.version! > user?.version!) {
            updateSession(users.get(userId!)!);
          } else {
            users.set(userId!, user!);
          }

          setUsers(users);
        }

        if (unsyncConversationsData && !!Object.values(unsyncConversationsData).length) {
          const { needSync, newEntry, messages: messagesCollection } = unsyncConversationsData;

          if (newEntry?.length > 0) await initConversations(newEntry);

          if (needSync?.length > 0) upsertConversation(needSync);

          if (messagesCollection?.length > 0) await updateMessagesForConversation(messagesCollection);
        }

        if (unsyncReadReceipts && !!unsyncReadReceipts.length) {
          const updateReadReceipt = useConversationStore.getState().conversationActions.updateReadReceipt;

          unsyncReadReceipts.forEach((receipt) => {
            updateReadReceipt(receipt);
          });
        }
      } catch (error) {
        console.error("Delta sync error:", error);
        const errObj = error instanceof Error ? error : new Error(String(error));
        setSyncError(errObj);
        throw errObj;
      } finally {
        finishLoading();
      }
    }

    async function processPendingReencrypts(targetUserId: string) {
      try {
        const res = await axios.get<any[]>(`/db/messages/pending-reencrypts?userId=${targetUserId}`);
        const requests = res.data;
        if (!requests || requests.length === 0) return;

        const myPrivateKey = useE2eeStore.getState().myPrivateKeyJwk;
        if (!myPrivateKey) return;

        for (const req of requests) {
          const reencryptedMessages: { id: string; message: string; publicKeyTimestamp?: number }[] = [];
          const now = Date.now();
          for (const msgId of req.messageIds) {
            const plaintext = findPlaintextMessage(msgId, req.conversationId);
            if (plaintext) {
              const newCiphertext = await encryptMessage(plaintext, req.requesterPublicKey, myPrivateKey);
              reencryptedMessages.push({ id: msgId, message: newCiphertext, publicKeyTimestamp: now });
            }
          }

          if (reencryptedMessages.length > 0) {
            socket.emit("REENCRYPT_RESPONSE", {
              messages: reencryptedMessages,
              conversationId: req.conversationId,
              targetUserId: req.requesterId,
            });
          }
        }
      } catch (err) {
        console.error("Failed to process pending re-encrypt requests:", err);
      }
    }

    async function checkWaitingMessagesDecryption() {
      try {
        const { waitingDecryptionIds, removeWaitingDecryptionIds } = useMessageStore.getState();
        if (waitingDecryptionIds.size === 0) return;

        const waitingIds = Array.from(waitingDecryptionIds);

        const res = await axios.post<IMessage[]>("/db/messages/by-ids", { messageIds: waitingIds });
        const fetchedMessages = res.data;
        if (!fetchedMessages || fetchedMessages.length === 0) return;

        const myPrivateKey = useE2eeStore.getState().myPrivateKeyJwk || undefined;
        const updates: { [convId: string]: IMessage[] } = {};

        for (const m of fetchedMessages) {
          const conversation = getConversationByConversationId(m.conversationId!);
          if (!conversation) continue;

          const otherMember = (conversation as IUserConversation).members.find(
            (mb) => mb.userId !== conversation.userId,
          );
          const otherUser = otherMember ? useStore.getState().users.get(otherMember.userId) : null;
          const otherPublicKey = resolvePublicKeyForTimestamp(
            otherUser?.publicKeyHistory,
            otherUser?.publicKey,
            m.publicKeyTimestamp ?? m.timestamp,
          );

          const decryptedText = await decryptMessage(m.message, otherPublicKey, myPrivateKey);
          if (decryptedText !== E2E_WAITING_MESSAGE) {
            const userConvId = conversation.id;
            if (!updates[userConvId]) {
              updates[userConvId] = [];
            }
            updates[userConvId].push({
              ...m,
              message: decryptedText,
            });
            useE2eeStore.getState().removePendingReencrypt([m.id]);
            removeWaitingDecryptionIds([m.id]);
          }
        }

        Object.entries(updates).forEach(([convId, msgs]) => {
          useMessageStore.getState().updateUserMessages(convId, msgs);
        });
      } catch (err) {
        console.error("Failed to check waiting messages decryption:", err);
      }
    }

    async function init() {
      try {
        const userId = user?.id;

        const [_, sessions] = await Promise.all([
          performDeltaSync(conversationController.signal),
          axios<ISession[]>(`/session/fetch?userId=${userId}`, { signal: sessionController.signal })
            .then((res) => res.data)
            .catch((err) => {
              console.error("Failed to fetch active sessions:", err);
              return [] as ISession[];
            }),
        ]);

        const validSessions = Array.isArray(sessions) ? sessions : [];

        if (validSessions.length > 0) {
          const { currentSession, activeSessions } = initSessions(validSessions);
          const storedConversations = useConversationStore.getState().conversations;

          if (currentSession) {
            setCurrentSession(currentSession);
          }
          setActiveSessions(activeSessions);

          const { channels, connections } = getSocketMetadata(storedConversations);

          const userRules = user?.rules || [];
          const blockedUsers = storedConversations
            .filter((c) => c.host === "user" && c.blocked === true)
            .map((c) => getReceiver(c!)?.id!)
            .filter((id) => Boolean(id));

          sendPresence([...connections], userRules, blockedUsers);

          const token = useAccessToken.getState().accessToken;

          socket.auth = { token, channels, session: currentSession };
          if (!socket.connected) socket.connect();

          await processPendingReencrypts(userId!);
          await checkWaitingMessagesDecryption();
        }
        setSyncError(null);
      } catch (error) {
        console.error("Sessions setter error:", error);
        setSyncError(error instanceof Error ? error : new Error(String(error)));
      } finally {
        finishLoading();
        setIsLoaded(true);
      }
    }

    function handleDisconnect() {
      if (!toast.isActive("network-status")) {
        toast.error("Reconnecting...", {
          toastId: "network-status",
          autoClose: false,
          closeOnClick: false,
          draggable: false,
          hideProgressBar: true,
        });
      }
    }

    function handleConnect() {
      if (useConversationStore.getState().isLoaded) {
        console.log("Connection restored. Triggering delta sync...");
        performDeltaSync();

        if (toast.isActive("network-status")) {
          toast.update("network-status", {
            render: "Connected",
            type: "success",
            autoClose: 3000,
            closeOnClick: true,
            draggable: true,
            hideProgressBar: true,
          });
        }
      }
    }

    socket.on("disconnect", handleDisconnect);
    socket.on("connect", handleConnect);
    window.addEventListener("offline", handleDisconnect);
    window.addEventListener("online", handleConnect);

    init();

    return () => {
      conversationController.abort();
      sessionController.abort();
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      window.removeEventListener("offline", handleDisconnect);
      window.removeEventListener("online", handleConnect);
    };
  }, [socket, session?.user.id, retryTrigger]);

  useEffect(() => {
    if (Notification.permission === "default") Notification.requestPermission();

    return () => {
      useConversationStore.getState().reset();
      useMessageStore.getState().reset();
      setIsLoaded(false);
    };
  }, []);

  if (syncError) {
    return (
      <InitializationError
        error={syncError}
        onRetry={() => {
          setIsLoaded(false);
          setRetryTrigger((prev) => prev + 1);
        }}
      />
    );
  }

  return <>{children}</>;
};
