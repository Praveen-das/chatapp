
interface IStatus { deletedFor: 'all' | string }

interface IReadReceipt {
    userId: string
    status: number
}

interface IRequest {
    from: string
    to: string
    updates: IUpdatesCollection[]
}

type IUpdatesCollection = Partial<IMessage>

type IUpdates = Map<{ conversationId: string, to: string }, IUpdatesCollection[]>

interface IDeleteRequest {
    conversationId: string
    to: string
    messages: any[]
}

interface IUser {
    userId: string
    socketId: string
    username: string
    connected: boolean
    messages: IMessage[] | null
    self?: boolean
    // groups: IMessage[]
    // requests: IRequest[]
}

interface ISession {
    id?: string
    userId: string
    socketId: string
    username: string
    connected: boolean
    lastSeen?: number
    self?: boolean
}

interface IMessage {
    _id?: string
    id: string
    conversationId: string
    message: string
    reply?: string
    from: string
    to: string
    timestamp: number
    readReceipt: IReadReceipt[]
    deletedFor: string[]
}

interface IMessageStore {
    saveMessages: (messages: IMessage[]) => void
    findMessagesForUser: (userId: string) => void
    updateUserMessages: (messagesId: string[], key: string, value: string) => void
}

type IKeyVal = string | number | IStatus

interface IGroupMember {
    username: string
    userId: string
    isAdmin: boolean
}

interface IGroup {
    displayName: string,
    members: IGroupMember[],
    id?: string
}

type IUsers = IUser[]
type IGroups = IGroup[]

interface IConversation {
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
    displayName?:string
    host?: 'user' | 'group'
    members: string[]
    admins: string[]
    messages?: IMessage[]
    createdAt: number
    updatedAt: number
    recentMessage?: IMessage
}

interface IUBlockReq {
    userId: string
    blockedId: string
    createtAt: number
}

type IArrayMap = [string, IMessage[]]

