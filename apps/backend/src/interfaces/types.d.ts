
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

interface IImagePayload {
  fileId?: string;
  name: string;
  size: number;
  filePath: string;
  url: string;
  fileType: string;
  thumbnailUrl: string;
}

interface IMessageDeleteFlag {
  userId: string;
  messageId: string;
  deleted: boolean;
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
  desc: string;
  profilePicture: string;
  members: {id:string}[];
  createdBy:string
  admins:string[]
}






