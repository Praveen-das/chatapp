import { IUser } from "./userInterface";

export interface IMessage {
  id: string;
  conversationId?: string;
  from: IUser | "system";
  message: string;

  attachment: IAttachment | null;
  reply?: IMessageReply;
  readReceipt: IReadReceipt[];
  deleted: boolean;
  timestamp: number;
}

export interface IDeleteResponse {
  conversationId: string;
  messages: Partial<IMessage>[];
}

export type IMessages = Map<string, IMessage[]>;

export type IUpdatesCollection = Partial<IMessage>;

export type IUpdates = Map<string, IUpdatesCollection[]>;

interface IReadReceipt {
  userId: string;
  status: number;
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

export type IImageAttachment = IImagePayload & {
  id: string;
  type: "images";
  sender?: string;
  status?: "uploading"|"success";
  
};

export type IAttachment = IImageAttachment | IUrlAttachment;

export interface IUserMedia {
  images?: IImageAttachment[];
  link?: IUrlAttachment[];
}

export interface IUrlAttachment {
  id: string;
  type: "link";
  host: string;
  url: string;
  metadata: IUrlMetadata | null;
}

export type IMediaStore = Map<string, IUserMedia>;

export interface IUnreadMessageMeta {
  from: string;
  id: string;
}
