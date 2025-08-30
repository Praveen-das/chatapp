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







