'use client'
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useStore } from '../../store/global';
import { useConversationStore } from '../../store/conversationStore';
import useAuth from '../../hooks/useAuth';
import axiosClient from '../../lib/axiosClient';
import getLocalStorage from '../../lib/localStorage';

function JoinGroupPage({ params: { groupId } }: { params: { groupId: string } }) {
    const { user } = useAuth()
    const router = useRouter()
    const setSelectedConversation = useConversationStore(s => s.setSelectedConversation)
    const conversations = useConversationStore(s => s.conversations)
    const [conversation, setConversation] = useState<IGroupConversation | null>(null)

    useEffect(() => {
        async function getConversation() {
            const _conversation: IGroupConversation = await axiosClient(`/group/fetch/${groupId}`)
                .then(res => res.data[0])
                .catch(res => console.log(res))

            setConversation(_conversation)
        }

        getConversation()
        router.push('/')
    }, [])

    useEffect(() => {
        if (!user) return
        if (conversation === null) return

        if (typeof window !== 'undefined') {
            if (!conversation) localStorage.setItem('group-join-req', JSON.stringify('invalid'))
            else {
                let userExistInGroup = conversation.members.some(m => m.id === user.id)
                if (userExistInGroup) setSelectedConversation(conversation.id)
                else localStorage.setItem('group-join-req', JSON.stringify(conversation))
            }
        }
        console.log('asdsadsadsad');

    }, [user, conversations, conversation])

    return null;
}




export default JoinGroupPage