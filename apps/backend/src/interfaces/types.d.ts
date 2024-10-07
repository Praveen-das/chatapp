
interface IReadReceipt {
  userId: string;
  status: number;
}

interface IUrlMetadata {
  title: string;
  url: string;
  host: string;
  description: string;
  image: string;
  error?: number;
}

type IAttachmentStatus = "loaded" | "uploaded" | "error";

interface IImageAttachment extends IImagePayload {
  id: string;
  type: "images";

}

interface IImagePayload {
  fileId?: string;
  name: string;
  size: number;
  filePath: string;
  url: string;
  fileType: string;
  thumbnailUrl: string;
}

interface IUrlAttachment {
  id: string;
  type: "link";
  host: string;
  url: string;
  metadata?: IUrlMetadata;
}

type IAttachment = IImageAttachment | IUrlAttachment;

interface IMessageDeleteFlag {
  userId: string;
  messageId: string;
  deleted: boolean;
}

interface IMessageReply {
  username: string;
  message: string;
  offsetTop: number;
  attachment?: IAttachment;
}

type IKeyVal = string | number | IStatus;

interface IRes {
  [key: string | number]: string | number;
}

interface BulkOperation {
  updateOne: {
    filter: any;
    update: any;
    upsert?: boolean;
    arrayFilters?: any;
  };
}

interface IGroupCreationReq {
  id: string;
  displayName: string;
  members: string[];
  createdBy:string
  admins:string[]
}






