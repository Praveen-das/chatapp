type IKeyValArray = [string, IMessage[]]

interface SocketProviderProps {
    children?: React.ReactNode
}

interface IMessageReply {
    message: string
    offsetTop: number
}

interface IReadReceipt {
    userId: string
    status: number
}

interface IAttachment {
    type: 'image'
    url: string
    thumbnail: string
    isUploaded: boolean
    size: number
}

interface IMessage {
    id: string
    conversationId?: string,
    message: string
    from?: string
    to: string
    attachment?: IAttachment
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


interface ISocketContext {
    sendMessage: (payload: IMessage, conversation: IIConversation) => any
    users: IUser[]
    registerConversation: (conversation: IIConversation | IGroupConversation, message?: IMessage) => void
    disconectSocket: () => void
    connectSocket: () => void
    sendReadReceiptChangeRequest: (updates: IUpdates) => void
    sendMessageDeleteRequest: (req: IDeleteRequest, all = false) => void
    onMessageForward: (conversation: IIConversation, messages: IMessage[]) => void
    sendGroupCreationRequest: (displayName: string, participants: string[]) => void
    addOrRemoveBlockedUser: (req: IUBlockReq) => void
    blockedUsers: IUBlockReq[],
    blockedByUsers: IUBlockReq[],
    sendUserBlockRequest: (req: IUBlockReq) => void,
    sendUserUnBlockRequest: (req: IUBlockReq) => void
}

interface IUBlockReq {
    userId: string
    blockedId: string
    createtAt: number
}

interface IGroupMember {
    username: string
    userId: string
    isAdmin: boolean
    id?: string,
}

interface IUser {
    host: 'user'
    self?: boolean
    socketId: string
    userId: string
    username: string
    connected: boolean
    messages: IMessage[]
    requests: IRequest[]
    lastSeen?: number
    latestMessage?: {
        message: string,
        timestamp: number
    }
}

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

interface IIConversation {
    id: string
    host?: 'user' | 'group'
    members: string[]
    createdAt: number
    updatedAt: number
    messages?: IMessage[]
    recentMessage?: IMessage
}

interface IGroupConversation {
    id: string
    channelId?: string
    displayName?: string
    host?: 'user' | 'group'
    members: string[]
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

type IConversation = IUser | IGroup

type IArrayMap = [string, IMessage[]]


