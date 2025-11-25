import useAuth from "@hooks/useAuth";
import useSocket from "context/SocketProvider";
import { useEffect } from "react";
import { useConversationStore } from "store/conversationStore";
import { useMessageStore } from "store/messageStore";

const clearUnreadMessages = useMessageStore.getState().clearUnreadMessages;

export default function useReadReceiptHandler() {
  const { user } = useAuth();
  const selectedConversation = useConversationStore((s) => s.selectedConversation);
  const { sendReadReceiptChangeRequest } = useSocket();

  useEffect(() => {
    if (!selectedConversation) return;
    if (!user) return;

    const conversationId = selectedConversation.id;
    const unreadMessages = useMessageStore.getState().getUnreadMessages(conversationId);
    const recentMessage = unreadMessages.at(-1)!;

    clearUnreadMessages(selectedConversation?.id);

    if (!recentMessage || recentMessage.from === user.id) return;

    sendReadReceiptChangeRequest([
      {
        conversationId: selectedConversation.conversationId,
        userId: user.id!,
        senderId: recentMessage.from!,
        lastReadMessageTimestamp: recentMessage.timestamp,
        updatedAt: Date.now(),
      },
    ]);
  }, [user, selectedConversation]);
}
