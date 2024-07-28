
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

interface IRule {
    isVisible: boolean
}

interface IUserRules {
    profilePicture: IRule
    bio: IRule
    lastSeen: IRule
    ReadReceipts: IRule
}

interface IUser {
    id: string
    username: string
    bio: string
    profilePicture: string
    rules?: IUserRules
    createdAt: number
    updatedAt: number
    self?: boolean
}

interface ISession {
    sessionId: string
    userId: string
}

interface IMessage {
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
    members: IUser[]
    createdAt: number
    updatedAt: number
    messages?: IMessage[]
    recentMessage?: IMessage
}

interface IGroupCreationReq {
    displayName: string
    members: string[]
}

interface IGroupConversation {
    id: string
    channelId?: string
    invitationId?: string
    displayName?: string
    desc?: string
    host?: 'user' | 'group'
    createdBy: string
    members: IUser[] | string[]
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

interface IUserRuleChangeRequest {
    userId: string, rules: IUserRules
}

