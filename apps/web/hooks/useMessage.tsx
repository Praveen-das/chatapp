import { useCallback } from 'react'
import useAuth from '../hooks/useAuth';
import { useMessageStore } from '../store/messageStore';
import { IMessageReadReceipt } from '../enums/enums';

function useMessage() {
    const { user } = useAuth();
    const replyRequest = useMessageStore(s => s.replyRequest);

    const generateMessageTemplate = useCallback((conversation: IConversation, message: string, attachment: IAttachment | null) => {
        const conversationId = conversation?.id
        const host = conversation?.host!
        let from = user?.id
        let to = host === 'group' ?
            (conversation as IGroupConversation)?.channelId! :
            conversation?.members.find(m => m.id !== user?.id)?.id!

        const readReceipt = conversation.members
            .filter(member => member.id !== user?.id)
            .map(member => ({ userId: member.id, status: IMessageReadReceipt.sent }))

        const payload: IMessage = {
            id: crypto.randomUUID(),
            conversationId,
            message,
            attachment,
            reply: replyRequest!,
            from,
            to,
            timestamp: Date.now(),
            host,
            readReceipt: readReceipt,
        };

        return payload
    }, [replyRequest, user])

    const regenerateMessageTemplate = useCallback((conversation: IConversation, { message, attachment }: IMessage) => {
        const conversationId = conversation?.id
        const host = conversation?.host!

        let from = user?.id
        let to = host === 'group' ?
            (conversation as IGroupConversation)?.channelId! :
            conversation?.members.find(m => m.id !== user?.id)?.id!

        const readReceipt = conversation.members
            .filter(member => member.id !== user?.id)
            .map(member => ({ userId: member.id, status: IMessageReadReceipt.sent }))

        const payload: IMessage = {
            from, to,
            id: crypto.randomUUID(),
            conversationId,
            message,
            attachment,
            timestamp: Date.now(),
            host,
            readReceipt,
        };

        return payload
    }, [user])

    return {
        generateMessageTemplate,
        regenerateMessageTemplate
    }
}

export default useMessage