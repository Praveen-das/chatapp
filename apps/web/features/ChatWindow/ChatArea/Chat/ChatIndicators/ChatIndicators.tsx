"use client";
import React, { useMemo } from "react";
import { useConversationStore } from "../../../../../store/conversationStore";
import { IMessage, IReadReceipt } from "@interfaces/messageInterface";
import Acknowledgment from "./Acknowledgment";
import { Timestamp } from "./Timestamp";
import { StarredIndicator } from "./StarredIndicator";
import { IMessageReadReceipt } from "enums/enums";

function getReadReceipt(readReceipts: IReadReceipt[]) {
  for (const [key, value] of Object.entries(IMessageReadReceipt)) {
    const status = parseInt(key);
    if (
      !isNaN(status) &&
      readReceipts.some((receipt) => receipt.status === status)
    ) {
      return value;
    }
  }
  return undefined;
}

export function ChatIndicators({
  chat, displayChatIndicators = true, hideIndicators,
}: {
  chat: IMessage;
  displayChatIndicators?: boolean;
  hideIndicators?: IHideIndicators;
}) {
  const selectedConversation = useConversationStore(
    (s) => s.selectedConversation
  );
  const readReceipt = useMemo(
    () => getReadReceipt(chat.readReceipt),
    [chat, selectedConversation]
  );

  return (
    displayChatIndicators && (
      <div
        className={`flex items-center gap-2 whitespace-nowrap mx-1 mt-1 text-xs ${!self ? "flex-row-reverse" : ""}`}
      >
        {!hideIndicators?.includes("starredIndicator") && (
          <StarredIndicator messageId={chat.id} />
        )}
        {!hideIndicators?.includes("timestamp") && (
          <Timestamp timeInMs={chat.timestamp} />
        )}
        {!hideIndicators?.includes("acknowledgment") && (
          <Acknowledgment readReceipt={readReceipt} />
        )}
      </div>
    )
  );
}
