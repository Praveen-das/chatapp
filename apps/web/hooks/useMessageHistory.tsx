import { IImageAttachment, IMessage, IUrlAttachment } from "@repo/interfaces/messageInterface";
import { useCallback, useEffect, useRef, useState } from "react";
import { useConversationStore } from "store/conversationStore";
import { useMessageStore } from "store/messageStore";
import { shallow } from "zustand/shallow";
import useAxios from "./useAxios";
import config from "../config/config";
import { useStore } from "store/global";
import { decrypt } from "@lib/e2e";
import { parseAttachments } from "@lib/messages";
import { useAttachments } from "store/attachments";

const { PAGINATION_LIMIT } = config;

function useMessageHistory() {
  const axios = useAxios();
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
    const conversationId = selectedConversation?.conversationId!;
    const timestamp = messageHistory[0]?.timestamp;
    const users = useStore.getState().users;
    const mediaStore: { images: IImageAttachment[]; link: IUrlAttachment[] } = { images: [], link: [] };

    const response = await fetchMessages(conversationId, timestamp?.toString());
    
    if (!response) return;

    response.forEach((message) => {
      if (message) {
        const attachment = parseAttachments(message);

        attachment?.imageAttachment && mediaStore.images.push(attachment?.imageAttachment!);
        attachment?.urlAttachment && mediaStore.link.push(attachment?.urlAttachment!);

        if (message.message) message.message = decrypt(message.message);
        message.user = users.find((u) => u.id === message.from);
      }
    });

    hasNextPage.current[selectedConversation?.id!] = response.length > PAGINATION_LIMIT;
    setMediaStore(selectedConversation?.id!, mediaStore);
    useMessageStore.getState().appendMessageHistory(selectedConversation?.id!, response);
  }, [messageHistory, selectedConversation]);

  const fetchMessages = useCallback(async (conversationId: string, cursor?: string) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({ cid: conversationId });
      params.append("limit", PAGINATION_LIMIT.toString());
      if (cursor) params.append("c", cursor);

      const res = await axios.get<IMessage[]>(`/db/messages/fetch?${params.toString()}`);
      return res.data;
    } catch (error) {
      console.log(error);
      return;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { messageHistory, hasNextPage: hasNextPage.current[conversationId], fetchOlderMessages, isLoading };
}

export default useMessageHistory;
