import { IMessage as _IMessage } from "@repo/interfaces/messageInterface";
import { Override } from "@repo/interfaces/type";
import { IUser, IUserRules } from "@repo/interfaces/userInterface";
import { IMessageReadReceipt } from "enums/enums";

export type IMessage = Override<
  _IMessage,
  {
    id: string;
    conversationId?: string;
    from?: string;
    to?: string;
    readReceiptStatus?: "sent" | "received" | "seen" | "unseen";
    self?: boolean;
  }
>;
