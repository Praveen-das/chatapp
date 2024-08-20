type IKeyValArray = [string, IMessage[]]

interface SocketProviderProps {
    children?: React.ReactNode
}

interface IMessageReply {
    username: string
    message: string
    offsetTop: number
    attachment: IAttachment | null
}

interface IReadReceipt {
    userId: string
    status: number
}

interface IUrlMetadata {
    title: string
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
    sender?: string
}

interface IUrlAttachment {
    id: string
    type: 'link'
    host: string
    url: string
    metadata: IUrlMetadata | null
}

type IAttachment = IImageAttachment | IUrlAttachment

type IMediaStore = Map<string, IUserMedia>

interface IUserMedia {
    images?: IImageAttachment[]
    link?: IUrlAttachment[]
}

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

interface IRequest {
    from: string
    to: string
    messageId: string
    status: IChatDeleteOptions
}

type IUpdates = Map<string, IUpdatesCollection[]>

interface IDeleteRequest {
    conversationId: string
    messages: any[]
}

interface IUBlockReq {
    userId: string
    blockedId: string
    createtAt?: number
}

interface IGroupMember {
    username: string
    userId: string
    isAdmin: boolean
    id?: string,
}

interface IRule {
    isVisible: boolean
}

interface IUserRules {
    profilePicture: IRule
    bio: IRule
    lastSeen: IRule
    readReceipts: IRule
}

interface IUser {
    id: string
    username: string
    bio: string
    profilePicture: string
    rules?: IUserRules
    status?: 'online' | 'offline'
    status?: 'online' | 'offline'
    lastSeen: number
    createdAt: number
    updatedAt: number
    self?: boolean
}

interface IUserNotificationPref { chatNotification: boolean, groupNotification: boolean }

interface ISelectedConversation {
    id: string
    conversationId?: string
    host: 'user' | 'group'
    displayName: string
    totalMembers: number
}

interface IGroup {
    id: string,
    host?: 'group'
    displayName: string,
    members: Partial<IGroupMember>[],
    messages: IMessage[],
    latestMessage: {
        message: string | null,
        timestamp: number
    }
}

interface IConversation {
    id: string
    displayName?: string
    host?: 'user' | 'group'
    members: IUser[]
    createdAt: number
    updatedAt: number
    messages?: IMessage[]
    recentMessage?: IMessage
}

interface IGroupCreationReq {
    displayName: string
    members: {
        _id: string,
    }
}

interface IGroupMember extends IUser {
    isAdmin: boolean
}

interface IGroupConversation {
    id: string
    channelId?: string
    invitationId?: string
    displayName?: string
    desc?: string
    host?: 'user' | 'group'
    members: IGroupMember[]
    createdBy: string
    admins: string[],
    messages?: IMessage[]
    createdAt: number
    updatedAt: number
    recentMessage?: IMessage
}

type IMessages = Map<string, IMessage[]>

type IUpdatesCollection = Partial<IMessage>

interface IUnreadMessageMeta {
    from: string,
    id: string
}

type IArrayMap = [string, IMessage[]]

type IModal<T = any> = {
    activeModal: string,
    state?: T
}


