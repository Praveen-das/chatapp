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
  conversationId: string;
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

interface IRule {
  isVisible: boolean;
}

interface IUserRules {
  profilePicture: IRule;
  bio: IRule;
  lastSeen: IRule;
  ReadReceipts: IRule;
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

interface ISession {
  sessionId: string;
  userId: string;
  username: string;
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


interface IMessage {
  id: string;
  conversationId?: string;
  from?: string | "system";
  to: string;
  message: string;

  attachment: IAttachment | null;
  reply?: IMessageReply;
  readReceipt: IReadReceipt[];
  deleted: boolean;
  timestamp: number;
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

interface IUserConversation {
  id: string;
  host: "user";
  members: IUser[];
  createdAt: number;
  updatedAt: number;
  messages?: IMessage[];
  recentMessage?: IMessage;
  unsaved?: boolean;
}

interface IGroupConversation {
  id: string;
  channelId: string;
  invitationId?: string;
  displayName?: string;
  desc?: string;
  host: "group";
  members: IGroupMember[];
  createdBy: string;
  admins: string[];
  messages?: IMessage[];
  createdAt: number;
  updatedAt: number;
  recentMessage?: IMessage;
}

type IConversation = IUserConversation | IGroupConversation 

interface IGroupCreationReq {
  displayName: string;
  members: string[];
  createdBy:string
  admins:string[]
}

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

interface IUserRuleChangeRequest {
  userId: string;
  rules: IUserRules;
}
