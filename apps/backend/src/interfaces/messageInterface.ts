import { Types } from "mongoose";

interface IMessageReply {
  messageId: Types.ObjectId;
  userId: Types.ObjectId;
  message: string;
  attachment?: IAttachment | null;
}

export interface IImageAttachment extends IImagePayload {
  id: string;
  type: "images";
}

export interface IUrlAttachment {
  id: string;
  type: "link";
  host: string;
  url: string;
  metadata?: IUrlMetadata;
}

export type IAttachment = IImageAttachment | IUrlAttachment;

export interface IMessage {
  id: Types.ObjectId;
  conversationId: Types.ObjectId;
  from: Types.ObjectId;
  to?: Types.ObjectId;
  message: string;

  attachment: IAttachment | null;
  hasAttachment: boolean;
  reply?: IMessageReply;
  readReceipt: IReadReceipt[];
  deleted: boolean;
  timestamp: number;
}
