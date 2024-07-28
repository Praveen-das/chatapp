interface IReadReceipt {
    userId: string
    status: number
}

interface IMessage {
    id: string
    conversationId: string
    message: string
    from: string
    to: string
    timestamp: number
    readReceipt: IReadReceipt[]
    deletedFor: String[]
}

type IKeyVal = string | number | IStatus

interface IRes {
    [key: string | number]: string | number
}

interface BulkOperation {
    updateOne: {
        filter: any;
        update: any;
        arrayFilters?: any
    };
}

interface IConversation {
    id: string,
    host?: 'user' | 'group'
    members: IUser[],
    createdAt: number,
    updatedAt: number,
}

interface IUser {
    id: string
    username: string
    bio: string
    profilePicture: string
    createdAt: number
    updatedAt: number
}