"use client";
import { Fragment, PointerEvent, TouchEvent, useCallback, useMemo, useRef } from "react";
import { useMessageStore } from "store/messageStore";
import useAuth from "../../../hooks/useAuth";
import { IMessage } from "../../../interfaces/messageInterface";
import { useConversationStore } from "../../../store/conversationStore";
import Chat from "./Chat/Chat";
import SystemMessage from "./Chat/Message/SystemMessage";

export function useChats(
  messages: IMessage[],
  notificationBar?: {
    enable: boolean;
    position: number;
    value: number;
  }
) {
  const { user } = useAuth();
  const setSelectedChats = useMessageStore((s) => s.setSelectedChats);
  const selectedChats = useMessageStore((s) => s.selectedChats);
  const selectedConversation = useConversationStore((s) => s.selectedConversation);
  const pointerEvent = useRef<NodeJS.Timeout | null | 0>(null);

  const haveSelectedChats = !!selectedChats.length;

  function startTouch(chat: IMessage) {
    pointerEvent.current = setTimeout(() => {
      setSelectedChats(chat);
      pointerEvent.current = null;
    }, 500);
  }

  function endTouch(chat: IMessage, e: PointerEvent<HTMLDivElement>) {
    if (e.cancelable) {
      e.preventDefault();
      if (pointerEvent.current) {
        clearTimeout(pointerEvent.current);
        pointerEvent.current = 0;
      }

      if (pointerEvent.current === 0) {
        haveSelectedChats && setSelectedChats(chat);
        pointerEvent.current = null;
      }
    } else {
      cancelTimeout();
    }
  }

  function cancelTimeout() {
    clearTimeout(pointerEvent.current!);
    pointerEvent.current = null;
  }

  return useMemo(
    () =>
      messages.map((chat: IMessage | IMessage, index: number, array: IMessage[]) => {
        if (!chat) return null;

        if (chat.type === "notification") return <SystemMessage key={chat.id} text={chat.message} />;

        const self = chat.from === user?.id;
        const isGroupConversation = selectedConversation?.host === "group";
        const currentMsgIsFromDifferentUser = array[index - 1]?.from !== chat.from;
        const avatarVisibility =
          !self && isGroupConversation ? (currentMsgIsFromDifferentUser ? "visible" : "hidden") : "none";

        return (
          <Fragment key={chat.id}>
            {notificationBar?.enable && index === notificationBar.position && (
              <div id="umNotificationBar" className="flex justify-center">
                <div className="w-full relative py-3 text-sm my-2 bg-primary flex justify-center items-center">
                  {notificationBar.value} New messages
                </div>
              </div>
            )}
            <div
              data-id={chat.id}
              onPointerDown={(e) => startTouch(chat)}
              onPointerUp={(e) => endTouch(chat, e)}
              onTouchEnd={(e) => e.preventDefault()}
              onPointerLeave={cancelTimeout}
            >
              <Chat
                self={self}
                chat={chat}
                reply={chat.reply}
                canSelect={!!haveSelectedChats}
                replyButton={selectedConversation?.host !== "system"}
                avatarVisibility={avatarVisibility}
                displayUsername={isGroupConversation && !self}
                isSelected={selectedChats.includes(chat)}
              />
            </div>
          </Fragment>
        );
      }),
    [messages, notificationBar, selectedChats, selectedConversation, user]
  );
}
