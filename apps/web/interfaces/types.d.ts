interface SocketProviderProps {
  children?: React.ReactNode;
}

interface IUrlMetadata {
  title: string;
  description: string;
  image: string;
  error?: number;
}

type IAttachmentStatus = "loaded" | "uploaded" | "error";

interface IRule {
  isVisible: boolean;
}

interface IUserRules {
  profilePicture: IRule;
  bio: IRule;
  lastSeen: IRule;
  readReceipts: IRule;
}

interface IUserNotificationPref {
  chatNotification: boolean;
  groupNotification: boolean;
}

interface IUpdateBlockReq {
  conversationId: Types.ObjectId;
  userId: Types.ObjectId;
  value: boolean;
}

type IHideIndicators =
  | ["acknowledgment" | "timestamp" | "starredIndicator" | "none"]
  | null;
