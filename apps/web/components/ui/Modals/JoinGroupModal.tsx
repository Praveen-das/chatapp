import moment from "moment";
import useSocket from "../../../context/SocketProvider";
import useAuth from "../../../hooks/useAuth";
import Avatar from "../../Dashboard/Components/Avatar";
import { useStore } from "../../../store/global";
import { IGroupConversation } from "../../../interfaces/conversationInterface";
import { IModal } from "@interfaces/modalInterface";

const closeModal = () => {
  document?.querySelector<HTMLDialogElement>("#action-modal")?.close();
};

export const JoinGroupModal = () => {
  const { sendGroupjoinRequest } = useSocket();
  const { user } = useAuth();
  const modal = useStore<IModal<IGroupConversation> | null>((s) => s.modal);

  const group = modal?.state;

  function handleClose() {
    closeModal();
  }

  function handleJoiningGroup() {
    if (!group) return;
    sendGroupjoinRequest(group!, user!);
    handleClose();
  }

  return (
    <div className="modal-box p-8 relative flex gap-2 items-center flex-col max-w-[450px] bg-[--modal]">
      {!group ? (
        <label htmlFor="">Group doesn't exist.</label>
      ) : (
        <>
          <Avatar
            url={group.profilePicture}
            size="120px"
            onlineIndication={false}
          />
          <label className="mt-4" htmlFor="">
            {group.displayName}
          </label>
          <label className="text-sm text-center text-white/20" htmlFor="">
            Created by {group.createdBy} on{" "}
            {moment(new Date(group.createdAt)).format("LT")}
          </label>
          <div className="avatar-group -space-x-4 rtl:space-x-reverse">
            {group.members.map((member, i) =>
              i > 4 ? null : (
                <div className="avatar border-base-300">
                    <div>
                        <Avatar
                          size="38px"
                          url={member.profilePicture}
                          onlineIndication={false}
                        />
                    </div>
                </div>
              )
            )}
            {group.members.length > 5 && (
              <div className="avatar border-base-300 placeholder">
                <div className="bg-base-200 text-neutral-content w-[38px]">
                  <span>+{group.members.length - 5}</span>
                </div>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-6">
            <div
              onClick={handleClose}
              className="btn  btn-outline h-10 min-h-10 rounded-full"
            >
              Cancel
            </div>
            <div
              onClick={handleJoiningGroup}
              className="btn  btn-primary h-10 min-h-10 rounded-full"
            >
              Join Group
            </div>
          </div>
        </>
      )}
    </div>
  );
};
