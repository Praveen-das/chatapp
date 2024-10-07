import { useMemo } from "react";
import useSocket from "../../../context/SocketProvider";
import useAuth from "../../../hooks/useAuth";
import { useConversationStore } from "../../../store/conversationStore";
import { useMessageStore } from "../../../store/messageStore";
import { useStore } from "../../../store/global";
import { IGroupConversation } from "../../../interfaces/conversationInterface";

const closeModal = () => {
    (document?.getElementById('action-modal') as HTMLDialogElement)?.close()
}

const GroupExitModal = () => {
    const setModal = useStore(s => s.setModal)
    const { leaveGroup } = useSocket()
    const toggleProfile = useStore(s => s.toggleProfile)
    const setSelectedConversation = useConversationStore(s => s.setSelectedConversation)

    const { user } = useAuth()
    const selectedConversation = useConversationStore(s => s.selectedConversation) as IGroupConversation

    const handleExitingGroup = () => {
        leaveGroup(selectedConversation, user!)
        toggleProfile(false)
        setSelectedConversation(null)
        setModal(null);
        closeModal()
    }

    return (
        <div className="modal-box flex flex-col justify-between gap-4 p-8 w-full max-w-xs bg-[--modal]">
            <div className="flex items-center justify-between">
                <label htmlFor="">Exit Group ?</label>
            </div>
            <div className="flex w-full justify-stretch gap-4 mx-auto">
                <form className="w-full" method="dialog">
                    <div className="w-full">
                        <button className={`btn btn-sm w-full`}>No</button>
                    </div>
                </form>
                <div className="w-full">
                    <button onClick={handleExitingGroup} className="btn btn-sm btn-secondary w-full">Yes</button>
                </div>
            </div>
        </div >
    );
};

export default GroupExitModal