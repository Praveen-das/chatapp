import { Types } from "mongoose";

export interface IMessage {
  id: Types.ObjectId;
  conversationId: Types.ObjectId;
  from: Types.ObjectId;
  to?: Types.ObjectId;
  message: string;

  attachment: IAttachment | null;
  reply?: IMessageReply;
  readReceipt: IReadReceipt[];
  deleted: boolean;
  timestamp: number;
}