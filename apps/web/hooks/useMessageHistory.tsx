import { IImageAttachment, IMessage, IUrlAttachment } from "@repo/interfaces/messageInterface";
import { useCallback, useEffect, useRef, useState } from "react";
import { useConversationStore } from "store/conversationStore";
import { useMessageStore } from "store/messageStore";
import { shallow } from "zustand/shallow";
import useAxios from "./useAxios";
import config from "../config/config";
import { decryptMessage, E2E_WAITING_MESSAGE, resolvePublicKeyForTimestamp } from "@lib/e2e";
import { useE2eeStore } from "store/e2eStore";
import { useStore } from "store/global";
import { parseAttachments } from "@lib/messages";
import { useAttachments } from "store/attachments";
import useAuth from "./useAuth";
import { IConversation } from "@repo/interfaces/conversationInterface";
import { IActivityLog } from "@interfaces/groupInterface";
import { IUserConversation } from "@interfaces/conversationInterface";
import socket from "@lib/ws";

const { PAGINATION_LIMIT } = config;

function useMessageHistory() {
  const axios = useAxios();
  const { user } = useAuth();
  const selectedConversation = useConversationStore((s) => s.selectedConversation);

  const [messageHistory, setMessageHistory] = useState<IMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const hasNextPage = useRef<{ [key: string]: boolean } & Object>({});

  const conversationId = selectedConversation?.id!;

  useEffect(() => {
    const unsubscribe = useMessageStore.subscribe(
      (state) => state.messageHistory.get(conversationId)?.slice() || [],
      (newValue) => {
        if (!(conversationId in hasNextPage.current))
          hasNextPage.current[conversationId] = newValue.length > PAGINATION_LIMIT;
        setMessageHistory(newValue);
      },
      { equalityFn: shallow, fireImmediately: true },
    );

    return () => {
      unsubscribe();
    };
  }, [conversationId]);

  const fetchOlderMessages = useCallback(async () => {
    if (!messageHistory.length || !selectedConversation) return;

    const currentConversation = selectedConversation;
    const { setMediaStore } = useAttachments.getState();
    const { conversationId, host } = currentConversation;
    const timestamp = messageHistory[0]?.timestamp;
    const mediaStore: { images: IImageAttachment[]; link: IUrlAttachment[] } = { images: [], link: [] };

    const response = await fetchMessages({
      conversationId,
      cursor: timestamp?.toString()!,
      deletedAt: currentConversation.deletedAt || currentConversation.createdAt!,
      host,
    });

    if (!response) return;

    const failedDecryptionMessageIds: string[] = [];
    const otherMember = (currentConversation as IUserConversation).members.find((m) => m.userId !== user?.id);
    let otherUser = otherMember ? useStore.getState().users.get(otherMember.userId) : null;
    const myPrivateKey = useE2eeStore.getState().myPrivateKeyJwk || undefined;

    // Lazy-fetch: if we have E2E messages and haven't loaded key history yet, fetch it
    if (currentConversation.host === "user" && otherUser && otherMember) {
      const hasE2eMessages = response.some((m) => m.message?.startsWith("v2:"));
      if (hasE2eMessages && !otherUser.publicKeyHistory?.length) {
        try {
          const keyHistoryResponse = await axios.get(`/db/user/key-history/${otherMember.userId}`);
          useStore.getState().updateUserFields(otherMember.userId, {
            publicKeyHistory: keyHistoryResponse.data,
          });
          otherUser = useStore.getState().users.get(otherMember.userId) ?? otherUser;
        } catch (e) {
          console.error("Failed to lazy-fetch key history:", e);
        }
      }
    }

    for (const message of response) {
      if (message) {
        const { imageAttachment, urlAttachment } = parseAttachments(message);

        imageAttachment && mediaStore.images.push(imageAttachment!);
        urlAttachment && mediaStore.link.push(urlAttachment!);

        if (message.message && message.message.startsWith("v2:")) {
          if (currentConversation.host === "user") {
            const otherPublicKey = resolvePublicKeyForTimestamp(
              otherUser?.publicKeyHistory,
              otherUser?.publicKey,
              message.publicKeyTimestamp ?? message.timestamp,
            );
            message.message = await decryptMessage(message.message, otherPublicKey, myPrivateKey);

            if (message.message === E2E_WAITING_MESSAGE) {
              const { pendingReencryptRequests, addPendingReencrypt } = useE2eeStore.getState();
              if (!pendingReencryptRequests.has(message.id)) {
                failedDecryptionMessageIds.push(message.id);
                addPendingReencrypt([message.id]);
              }
            }
          }
        }

        if (message.reply?.message && message.reply.message.startsWith("v2:")) {
          if (currentConversation.host === "user") {
            const otherPublicKey = resolvePublicKeyForTimestamp(
              otherUser?.publicKeyHistory,
              otherUser?.publicKey,
              message.publicKeyTimestamp ?? message.timestamp,
            );
            message.reply.message = await decryptMessage(message.reply.message, otherPublicKey, myPrivateKey);

            if (message.reply.message === E2E_WAITING_MESSAGE) {
              const { pendingReencryptRequests, addPendingReencrypt } = useE2eeStore.getState();
              if (!pendingReencryptRequests.has(message.id)) {
                failedDecryptionMessageIds.push(message.id);
                addPendingReencrypt([message.id]);
              }
            }
          }
        }
        // message.user = users.find((u) => u.id === message.from);
      }
    }

    if (failedDecryptionMessageIds.length > 0 && otherMember && user?.id) {
      const myPublicKey = useE2eeStore.getState().myPublicKeyJwk;
      if (myPublicKey) {
        socket.emit("REQUEST_REENCRYPT", {
          messageIds: failedDecryptionMessageIds,
          conversationId: currentConversation.conversationId!,
          requesterPublicKey: myPublicKey,
          requesterId: user.id,
          targetUserId: otherMember.userId,
        });
      }
    }

    hasNextPage.current[currentConversation.id] = response.length > PAGINATION_LIMIT;
    setMediaStore(currentConversation.id, mediaStore);
    useMessageStore.getState().appendMessageHistory(currentConversation.id, response);
  }, [messageHistory, selectedConversation, user]);

  const fetchMessages = useCallback(
    async ({
      conversationId,
      cursor,
      deletedAt,
      host,
      activityLog,
    }: {
      conversationId: string;
      cursor: string;
      deletedAt: number;
      host: IConversation["host"];
      activityLog?: IActivityLog;
    }) => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams({ cid: conversationId });
        params.append("limit", PAGINATION_LIMIT.toString());
        params.append("host", host);

        if (cursor) params.append("c", cursor);
        if (user?.id) params.append("userId", user.id);
        if (deletedAt) params.append("deletedAt", deletedAt.toString());

        const res = await axios.get<IMessage[]>(`/db/messages/fetch?${params.toString()}`);
        return res.data;
      } catch (error) {
        console.log(error);
        return;
      } finally {
        setIsLoading(false);
      }
    },
    [user],
  );

  return { messageHistory, hasNextPage: hasNextPage.current[conversationId], fetchOlderMessages, isLoading };
}

export default useMessageHistory;
