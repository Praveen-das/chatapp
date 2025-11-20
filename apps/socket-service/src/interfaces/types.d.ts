interface IStatus {
  deletedFor: "all" | string;
}

interface IReadReceipt {
  userId: string;
  status: number;
}

type IUpdatesCollection = Partial<IMessage>;

type IUpdates = Map<
  { conversationId: string; to: string },
  IUpdatesCollection[]
>;

interface IClearConversationRequest {
  conversation: IConversation;
  userId: string;
  deletedForUser?: boolean;
  timeOfDeletion?:number
}

interface IDeleteRequest {
  conversation: IGroupConversation | IConversation;
  to: string;
  messages: any[];
}

interface IDeleteForUserRequest {
  conversationId: string;
  collection: {
    userId: string;
    messageId: string;
  }[];
}

interface IUser {
  id: string;
  username: string;
  bio: string;
  profilePicture: string;
  rules?: IUserRules;
  createdAt: number;
  updatedAt: number;
  self?: boolean;
}

interface IImagePayload {
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

type IAttachment = IImageAttachment | IUrlAttachment;

type IImageAttachment = IImagePayload & {
  id: string;
  type: "images";
  sender?: string;
  status?: "uploading"|"success";
};

interface IUrlAttachment {
  id: string;
  type: "link";
  host: string;
  url: string;
  // metadata: IUrlMetadata | null;
}

interface IMessageStore {
  saveMessages: (messages: IMessage[]) => void;
  findMessagesForUser: (userId: string) => void;
  updateUserMessages: (
    messagesId: string[],
    key: string,
    value: string
  ) => void;
}

type IKeyVal = string | number | IStatus;

interface IGroupMember extends IUser {
  isAdmin: boolean;
}

type IUsers = IUser[];

type IHost = "user" | "group";

interface INewConversation {
  id: string;
  host: "user";
  members: IUser[];
  createdAt: number;
  updatedAt: number;
}

interface IConversationBase {
  id: string;
  displayName?: string;
  createdAt: number;
  updatedAt: number;
  messages?: IMessage[];
  recentMessage?: IMessage;
  active?: boolean;
  archived?: boolean;
  conversationId: string;
  tags?: string[];
}

interface IUserConversation extends IConversationBase {
  userId: string;
  host: "user";
  members: IUser[];
  
  blocked?: boolean;
  blockedByUser?: boolean;
}

type IConversation = IUserConversation | IGroupConversation 

interface IBlocked {
  id: string;
  user: IUser;
  blockedUser: IUser;
}

interface IUBlockReq {
  id: string;
  userId: string;
  blockedId: string;
}

type IArrayMap = [string, IMessage[]];

interface IUserUpdateRequest {
  userId: string;
  updates: Partial<IUser>;
}



