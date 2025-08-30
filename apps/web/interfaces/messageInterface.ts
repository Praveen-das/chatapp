import { IMessage as _IMessage } from "@repo/interfaces/messageInterface";
import { Override } from "@repo/interfaces/type";
import { IUser } from "@repo/interfaces/userInterface";

export type IMessage = Override<
  _IMessage,
  {
    id: string;
    conversationId?: string;
    from?: string;
    to?: string;
    user?: IUser;
    self?: boolean;
  }
>;
