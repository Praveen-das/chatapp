import useSelectedConversation from "@hooks/useSelectedConversation"
import { useAttachments } from "../../store/attachments"
import { useStore } from "../../store/global"

function StarredMessages() {
    const setProfileTab = useStore(s => s.setProfileTab)
    const total = useSelectedConversation()?.starred?.length || 0
    
    return (
        <div onClick={() =>!!total&& setProfileTab('starred_messages')} className={`capitalize w-full flex items-center justify-between gap-4 ${!!total ? 'cursor-pointer':''}`}>
            Starred Messages
            <span>{total}</span>
        </div>
    )
}

export default StarredMessages