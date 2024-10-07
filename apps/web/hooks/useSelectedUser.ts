import { useMemo } from "react"
import { useStore } from "../store/global"

const useSelectedUser = () => {
    const users = useStore(s => s.users)
    const selectedUser = useStore(s => s.selectedUser)
    const user = useMemo(() => users.find(u => u.id === selectedUser?.id) || null, [users, selectedUser])
    return user
}

export default useSelectedUser