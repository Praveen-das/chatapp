import useAuth from "@hooks/useAuth";
import { IMessage } from "@interfaces/messageInterface";
import { MutableRefObject, useEffect, useRef } from "react";
import { useConversationStore } from "store/conversationStore";
import { useMessageStore } from "store/messageStore";
import { VListHandle } from "virtua";

type Props = {
  listRef: VListHandle | null;
  isScrolledToBottom: boolean;
  isFocused: boolean;
  initialValue: MutableRefObject<number>;
  setNewMessageBadge: React.Dispatch<React.SetStateAction<number>>;
  setShowUnreadNotificationBar: React.Dispatch<React.SetStateAction<boolean>>;
  messages: IMessage[];
  messageHistory: IMessage[];
  unreadMessages: IMessage[];
}

export default function useScrollForNewMessages({
  listRef,
  isScrolledToBottom,
  isFocused,
  initialValue,
  setNewMessageBadge,
  setShowUnreadNotificationBar,
  messages,
  messageHistory,
  unreadMessages,
}: Props) {
  const { user } = useAuth();
  const selectedConversation = useConversationStore((s) => s.selectedConversation);

  const lastMessageReference = useRef<IMessage | null>(null);
  const mounted = useRef(false);

  // Custom hook to handle setting scrollbar for new messages
  useEffect(() => {
    if (!listRef) return;
    if (!mounted.current) return;

    const recentMessage = messages.at(-1) || null;

    const self = recentMessage?.from === user?.id && recentMessage?.id !== lastMessageReference.current?.id;

    let recentMessageIdx = messages.length + messageHistory.length - 1;

    if (isScrolledToBottom || (self && recentMessage?.from !== "system")) listRef?.scrollToIndex(recentMessageIdx);

    if (!isFocused) {
      setNewMessageBadge(unreadMessages.length - initialValue.current);
    }

    if (!unreadMessages.length) {
      initialValue.current = 0;
      setShowUnreadNotificationBar(false);
    }

    lastMessageReference.current = recentMessage;
  }, [listRef, messageHistory, messages, unreadMessages]);

  // responsible for setting initial scrollbar position and messages flag
  useEffect(() => {
    if (!selectedConversation) return;
    if (!listRef) return;

    const getMessages = useMessageStore.getState().getUserMessages;
    const getUnreadMessages = useMessageStore.getState().getUnreadMessages;

    const conversationId = selectedConversation.id;

    const messages = getMessages(conversationId) || [];
    const messageHistory = useMessageStore.getState().messageHistory.get(conversationId) || [];
    const unreadMessages = getUnreadMessages(conversationId);
    const scrollToIndex = messageHistory.length + messages.length - unreadMessages.length - 1;

    listRef.scrollToIndex(scrollToIndex, { align: "center" });
    setShowUnreadNotificationBar(!!unreadMessages.length);
    mounted.current = true;
  }, [listRef, selectedConversation]);

  useEffect(
    () => () => {
      mounted.current = false;
    },
    [selectedConversation]
  );
}
