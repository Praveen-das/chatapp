import { useConversationStore } from "../store/conversationStore"

const useSelectedConversation = () => {
    const conversations = useConversationStore(s => s.conversations)
    const _selectedConversation = useConversationStore(s => s.selectedConversation)
    return conversations.find(c => c.id === _selectedConversation?.id) || null
}

export default useSelectedConversation