import useSocket from "../../../context/SocketProvider";
import useAuth from "../../../hooks/useAuth";
import { useStore } from "../../../store/global";
import { IGroupConversation } from "@repo/interfaces/conversationInterface";
import { IModal } from "@interfaces/modalInterface";
import FramerWrapper from "../MotionWrapper";

const GroupExitModal = () => {
  const setModal = useStore((s) => s.setModal);
  const modal = useStore<IModal<IGroupConversation> | null>((s) => s.modal);
  const { leaveGroup } = useSocket();

  const { user } = useAuth();
  const conversation = modal?.state!;

  const handleExitingGroup = () => {
    leaveGroup(conversation, user!);
    setModal(false);
  };

  return (
    <FramerWrapper className={`modal-box flex flex-col justify-between gap-4 p-8 w-full max-w-xs bg-[--modal]`}>
      <label className="mb-4" htmlFor="">
        Exit Group ?
      </label>
      <div className="flex w-full justify-stretch gap-4 mx-auto">
        <form className="w-full" method="dialog">
          <div className="w-full">
            <button className={`btn btn-sm [--b2:--b1] btn-block`}>No</button>
          </div>
        </form>
        <div className="w-full">
          <button onClick={handleExitingGroup} className="btn btn-sm btn-error btn-block">
            Yes
          </button>
        </div>
      </div>
    </FramerWrapper>
  );
};

export default GroupExitModal;
