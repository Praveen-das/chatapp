import { IUser, IPublicKeyVersion } from "./userInterface";

export interface IMessage {
  id: string;
  conversationId?: string;
  from?: string;
  to?: string;
  message: string;
  type: "message" | "placeholder" | "service_message" | "notification" | "generating";

  attachment?: IAttachment | null;
  reply?: IMessageReply;
  timestamp: number;
  publicKeyTimestamp?: number;
  deleted: boolean;
  hasAttachment?: boolean;
}

export interface IReencryptRequest {
  messageIds: string[];
  conversationId: string;
  requesterPublicKey: string; // The receiver's NEW public key
  requesterId: string;
  targetUserId: string;       // The sender of original messages
}

export interface IReencryptResponse {
  messages: { id: string; message: string; publicKeyTimestamp?: number }[]; // Re-encrypted message contents
  conversationId: string;
  targetUserId: string; // The receiver's user ID (who requested re-encryption)
  publicKeyHistory?: IPublicKeyVersion[];
}

export type ISystemMessage = Omit<IMessage, "readReceipt" | "deleted" | "user" | "reply">;

export interface IDeleteResponse {
  conversationId: string;
  messages: Partial<IMessage>[];
}

export type IMessages = Map<string, IMessage[]>;

export type IUpdatesCollection = Partial<IMessage>;

export type IReadReceiptUpdatesCollection = {
  id: string;
  readReceipt: IReadReceipt[];
};

export type IUpdates = Map<string, IUpdatesCollection[]>;

export interface IReadReceipt {
  userId: string;
  status: number;
}

export type MessageReadReceipt = {
  conversationId: string;
  senderId: string;
  userId: string;
  lastDeliveredMessageTimestamp?: number;
  lastReadMessageTimestamp?: number;
  updatedAt?: number;
};

export interface IUserMedia {
  images?: IImageAttachment[];
  link?: IUrlAttachment[];
}

export interface IUrlMetadata {
  title: string;
  description: string;
  image: string;
  error?: number;
}

export interface IUrlAttachment {
  id: string;
  type: "link";
  host: string;
  url: string;
  metadata?: IUrlMetadata | null;
}

export interface IImagePayload {
  fileId?: string;
  name: string;
  size: number;
  filePath?: string;
  file?: File;
  url: string;
  fileType: string;
  width?: number;
  height?: number;
  thumbnailUrl?: string;
}

export type IImageAttachment = {
  id: string;
  type: "images";
  senderId?: string;
  status?: "uploading" | "success";
  loaded?: boolean;
} & IImagePayload;

export interface IMessageReply {
  messageId: string;
  userId: string;
  message: string;
  attachment?: IAttachment | null;
}

export type IAttachment = IImageAttachment | IUrlAttachment;

export type IMediaStore = Map<string, IUserMedia>;

export interface IUnreadMessageMeta {
  from: string;
  id: string;
  message: string;
}
