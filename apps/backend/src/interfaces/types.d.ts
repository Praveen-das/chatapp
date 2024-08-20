interface IReadReceipt {
    userId: string
    status: number
}

interface IUrlMetadata {
    title: string
    url: string
    host: string
    description: string
    image: string
    error?: number
}

type IAttachmentStatus = 'loaded' | 'uploaded' | 'error'

interface IImageAttachment {
    id: string
    type: 'images'
    
    status?: IAttachmentStatus
    url: string
    thumbnail: string
}

interface IUrlAttachment {
    id: string
    type: 'link'
    host: string
    url: string
    metadata?: IUrlMetadata
}

type IAttachment = IImageAttachment | IUrlAttachment

interface IMessage {
    id: string
    conversationId?: string,
    message: string
    from?: string
    to: string
    attachment: IAttachment | null
    timestamp: number
    readReceipt: IReadReceipt[]
    deletedFor?: string[]
    status?: IChatDeleteOptions
    reply?: IMessageReply
    host: 'user' | 'group'
}

interface IChatDeleteOptions {
    deletedFor: 'all' | string
}

interface IMessageReply {
    username: string
    message: string
    offsetTop: number
    attachment?: IAttachment
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