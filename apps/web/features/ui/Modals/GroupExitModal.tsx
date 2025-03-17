import { useMemo } from "react";
import useSocket from "../../../context/SocketProvider";
import useAuth from "../../../hooks/useAuth";
import { useConversationStore } from "../../../store/conversationStore";
import { useMessageStore } from "../../../store/messageStore";
import { useStore } from "../../../store/global";
import { IGroupConversation } from "../../../interfaces/conversationInterface";
import { IModal } from "@interfaces/modalInterface";

const GroupExitModal = () => {
    const setModal = useStore(s => s.setModal)
    const modal = useStore<IModal<IGroupConversation>|null>(s => s.modal)
    const { leaveGroup } = useSocket()

    const { user } = useAuth()
    const conversation = modal?.state!

    const handleExitingGroup = () => {
        leaveGroup(conversation, user!)
        setModal(null);
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