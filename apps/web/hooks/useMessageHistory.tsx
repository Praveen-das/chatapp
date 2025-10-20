import { IImageAttachment, IMessage, IUrlAttachment } from "@repo/interfaces/messageInterface";
import { useCallback, useEffect, useRef, useState } from "react";
import { useConversationStore } from "store/conversationStore";
import { useMessageStore } from "store/messageStore";
import { shallow } from "zustand/shallow";
import useAxios from "./useAxios";
import config from "../config/config";
import { decrypt } from "@lib/e2e";
import { parseAttachments } from "@lib/messages";
import { useAttachments } from "store/attachments";
import useAuth from "./useAuth";
import { IConversation } from "@repo/interfaces/conversationInterface";
import { IActivityLog } from "@interfaces/groupInterface";

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
      { equalityFn: shallow, fireImmediately: true }
    );

    return () => {
      unsubscribe();
    };
  }, [conversationId]);

  const fetchOlderMessages = useCallback(async () => {
    if (!messageHistory.length) return;

    const { setMediaStore } = useAttachments.getState();
    const { conversationId, host } = selectedConversation!;
    const timestamp = messageHistory[0]?.timestamp;
    const mediaStore: { images: IImageAttachment[]; link: IUrlAttachment[] } = { images: [], link: [] };

    const response = await fetchMessages({
      conversationId,
      cursor: timestamp?.toString()!,
      deletedAt: selectedConversation?.deletedAt!,
      host,
    });

    if (!response) return;

    response.forEach((message) => {
      if (message) {
        const { imageAttachment, urlAttachment } = parseAttachments(message, selectedConversation!);

        imageAttachment && mediaStore.images.push(imageAttachment!);
        urlAttachment && mediaStore.link.push(urlAttachment!);

        if (message.message) message.message = decrypt(message.message);
        // message.user = users.find((u) => u.id === message.from);
      }
    });

    hasNextPage.current[selectedConversation?.id!] = response.length > PAGINATION_LIMIT;
    setMediaStore(selectedConversation?.id!, mediaStore);
    useMessageStore.getState().appendMessageHistory(selectedConversation?.id!, response);
  }, [messageHistory, selectedConversation, user]);

  const fetchMessages = useCallback(
    async ({
      conversationId,
      cursor,
      deletedAt,
      host,
      activityLog
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
    [user]
  );

  return { messageHistory, hasNextPage: hasNextPage.current[conversationId], fetchOlderMessages, isLoading };
}

export default useMessageHistory;
