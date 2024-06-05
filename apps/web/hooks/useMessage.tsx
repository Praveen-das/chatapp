import React, { useCallback } from 'react'
import { useAuth } from '../context/AuthContext';
import { useStore } from '../store/global';
import { generateConversation } from '../helpers/helpers';
import { useMessages } from '../store/messageStore';
import { IMessageReadReceipt } from '../enums/enums';

function useMessage() {
    const { user } = useAuth();
    const selectedConversation = useStore(s => s.selectedConversation);
    const selectedUser = useStore(s => s.selectedUser);
    const replyRequest = useMessages(s => s.replyRequest);


    let conversation = selectedConversation || generateConversation(user?.id!, selectedUser?.userId!)


    const generateMessageTemplate = useCallback((message: string, attachment?: IAttachment) => {
        const conversationId = conversation?.id
        let from = user?.id
        let to = (conversation as IGroupConversation)?.channelId || conversation?.members.find(member => member !== user?.id)!
        const host = conversation?.host!

        const readReceipt = conversation.members
            .map(member =>
                member !== user?.id &&
                {
                    userId: member,
                    status: IMessageReadReceipt.sent
                }
            )
            .filter(c => c !== false)

        const payload: IMessage = {
            from, to,
            id: crypto.randomUUID(),
            conversationId,
            message,
            attachment,
            reply: replyRequest!,
            timestamp: Date.now(),
            host,
            readReceipt: readReceipt,
        };

        return payload
    }, [])

    return {
        generateMessageTemplate,
    }
}

export default useMessage