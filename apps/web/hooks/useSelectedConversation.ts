import { useMemo } from "react"
import { useConversationStore } from "../store/conversationStore"

const useSelectedConversation = () => {
    const conversations = useConversationStore(s => s.conversations)
    const selectedConversation = useConversationStore(s => s.selectedConversation)
    const conversation = useMemo(() => conversations.find(c => c.id === selectedConversation?.id) || null, [conversations, selectedConversation])
    return conversation
}

export default useSelectedConversation