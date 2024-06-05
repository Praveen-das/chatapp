import { create } from "zustand";

interface IGlobalStore {
    selectedUser: IUser | null
    setSelectedUser: (user: IUser | null) => void

    selectedConversation: IIConversation | IGroupConversation | null
    setSelectedConversation: (conversation: IIConversation | IGroupConversation | null) => void

    selectedGroupMembers: string[]
    setSelectedGroupMembers: (userId: string | null) => void

    menuOption: string | null
    setMenuOption: (option: string | null) => void

    modalState: string | null
    setModalState: (component: string | null) => void

}

export const useStore = create<IGlobalStore>((set, get) => {
    return {
        selectedUser: null,
        setSelectedUser: (user) => set({ selectedUser: user }),

        selectedConversation: null,
        setSelectedConversation: (conversation) => set({ selectedConversation: conversation }),

        selectedGroupMembers: [],
        setSelectedGroupMembers: (userId: string | null) => {
            const _selectedGroupMembers = get().selectedGroupMembers

            if (!userId) return set({ selectedGroupMembers: [] })

            if (_selectedGroupMembers.some(s => s === userId)) {
                const selectedGroupMembers = _selectedGroupMembers.filter(s => s !== userId)
                return set({ selectedGroupMembers })
            }
            set(s => ({ selectedGroupMembers: [userId, ...s.selectedGroupMembers] }))
        },

        menuOption: null,
        setMenuOption: (option) => set(({ menuOption: option })),

        modalState: null,
        setModalState: (component) => set({ modalState: component }),
        
    }
})
