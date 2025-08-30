import useMessageHistory from "@hooks/useMessageHistory";
import useMessages from "@hooks/useMessages";
import { IMessage } from "@interfaces/messageInterface";
import React, { useCallback, useEffect, useRef } from "react";
import { VListHandle } from "virtua";

type Props = {
  listRef: VListHandle | null;
  messages: IMessage[];
  messageHistory: IMessage[];
};

function useScrollToReply({ messages, messageHistory, listRef }: Props) {
  const timeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const myCustomEvent = (event: any) => handleOffsetToReply(event.detail.id);
    document.addEventListener("myCustomEvent", myCustomEvent);
    return () => document.removeEventListener("myCustomEvent", myCustomEvent);
  }, [messages, messageHistory, listRef]);

  const handleOffsetToReply = useCallback(
    (messageId: string) => {
      if (!listRef) return;

      let index = messages.findIndex((m) => m.id === messageId);
      if (index === -1) index = messageHistory.findIndex((m) => m.id === messageId);
      else index = index + messageHistory.length;

      listRef.scrollToIndex(index);

      if (timeout.current) clearTimeout(timeout.current);

      timeout.current = setTimeout(() => {
        const elm = document.querySelector<HTMLElement>(`[data-id="${messageId}"]`);
        if (!elm) return;

        elm.classList.remove("focus");
        void elm.offsetWidth;
        elm.classList.add("focus");
      }, 100);
    },
    [messages, messageHistory, listRef]
  );
}

export default useScrollToReply;
