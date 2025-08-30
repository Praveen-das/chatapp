import useAuth from "@hooks/useAuth";
import { IUpdates, IReadReceiptUpdatesCollection } from "@repo/interfaces/messageInterface";
import useSocket from "context/SocketProvider";
import { IMessageReadReceipt } from "enums/enums";
import React, { useEffect } from "react";
import { useConversationStore } from "store/conversationStore";
import { useMessageStore } from "store/messageStore";

export default function useReadReceiptHandler() {
  const { user } = useAuth();
  const selectedConversation = useConversationStore((s) => s.selectedConversation);
  const { sendReadReceiptChangeRequest } = useSocket();

  useEffect(() => {
    if (!selectedConversation) return;
    const conversationId = selectedConversation.id;
    const getUnreadMessages = useMessageStore.getState().getUnreadMessages;

    const updates: IUpdates = new Map();
    const unreadMessages = getUnreadMessages(conversationId);

    const status = IMessageReadReceipt.seen;

    for (let { id, from } of unreadMessages || []) {
      const isReceiver = from !== user?.id;

      if (isReceiver) {
        let update = {
          id,
          readReceipt: [{ userId: user?.id!, status }],
        };

        let key = {
          conversationId: selectedConversation.conversationId,
          to: from!,
        };

        updates.upsert(key, update);
      }
    }

    sendReadReceiptChangeRequest(updates);
  }, [user, selectedConversation]);
}
