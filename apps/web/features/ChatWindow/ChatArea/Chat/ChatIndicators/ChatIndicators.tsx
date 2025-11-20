"use client";
import Acknowledgment from "./Acknowledgment";
import { Timestamp } from "./Timestamp";
import { StarredIndicator } from "./StarredIndicator";
import { IMessage } from "../../../../../interfaces/messageInterface";
import { memo } from "react";

function ChatIndicators({
  chat,
  displayChatIndicators = true,
  hideIndicators,
  readReceipt
}: {
  chat: IMessage;
  displayChatIndicators?: boolean;
  hideIndicators?: IHideIndicators;
  readReceipt:IMessage["readReceiptStatus"]
}) {
  
  return (
    displayChatIndicators && (
      <div className={`flex items-center gap-2 whitespace-nowrap mx-1 mt-1 text-xs ${!self ? "flex-row-reverse" : ""}`}>
        {!hideIndicators?.includes("starredIndicator") && <StarredIndicator messageId={chat.id} />}
        {!hideIndicators?.includes("timestamp") && <Timestamp timeInMs={chat.timestamp} />}
        {!hideIndicators?.includes("acknowledgment") && <Acknowledgment readReceipt={readReceipt} />}
      </div>
    )
  );
}

export default memo(ChatIndicators)
