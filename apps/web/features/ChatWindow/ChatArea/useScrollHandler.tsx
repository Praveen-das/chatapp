import { IMessage } from "@interfaces/messageInterface";
import React, { Key, MutableRefObject, useCallback, useEffect, useRef } from "react";
import { VListHandle } from "virtua";

type Props = {
  id: Key;
  messages: IMessage[];
  messageHistory: IMessage[];
  unreadMessages: IMessage[];
  listRef: VListHandle | null;
  initialValue: MutableRefObject<number>;
  setNewMessageBadge: React.Dispatch<React.SetStateAction<number>>;
  isFocused: MutableRefObject<boolean>;
  isScrolledToBottom: MutableRefObject<boolean>;
  onScrolledToTop: () => void;
};

function useScrollHandler({
  id,
  messages,
  messageHistory,
  unreadMessages,
  listRef,
  initialValue,
  setNewMessageBadge,
  isFocused,
  isScrolledToBottom,
  onScrolledToTop,
}: Props) {
  const canShift = useRef(false);
  const isStartElm = useRef(false);

  const onScroll = useCallback(() => {
    if (!listRef) return;

    let THRESHOLD = 2;
    let startIndex = listRef?.findStartIndex()!;
    let endIndex = listRef?.findEndIndex()!;
    let lastReadMsgIndex = messageHistory.length + messages.length - (unreadMessages.length - initialValue.current) - 1;
    let lastItemIndex = messageHistory.length + messages.length - 1;

    // scrollbar reaches the top
    if (startIndex <= THRESHOLD && !isStartElm.current) {
      onScrolledToTop()
      canShift.current = true; //
      isStartElm.current = true;
    }

    // scrollbar move from top
    if (startIndex > THRESHOLD) {
      isStartElm.current = false;
      canShift.current = false;
    }

    if (endIndex > lastReadMsgIndex) {
      setNewMessageBadge(0);
      initialValue.current = unreadMessages.length;
      isFocused.current = true;
    } else {
      isFocused.current = false;
    }

    isScrolledToBottom.current = endIndex === lastItemIndex;
  }, [listRef, messageHistory, messages, unreadMessages]);

  useEffect(() => {
    return () => {
      isStartElm.current = false;
      canShift.current = false;
    };
  }, [id]);

  return {
    onScroll,
    canShift,
  };
}

export default useScrollHandler;
