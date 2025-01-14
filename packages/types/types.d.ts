interface SocketProviderProps {
  children?: React.ReactNode;
}

interface IMessageReply {
  username: string;
  message: string;
  attachment: IAttachment | null;
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


type IModal<T = any> = {
  activeModal: string;
  state?: T;
};
