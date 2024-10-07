"use client";
import { useMessageStore } from "../../store/messageStore";
import { useStore } from "../../store/global";
import { ForwardMessageModal } from "./Modals/ForwardMessageModal";
import { DeleteMessageModal } from "./Modals/DeleteMessageModal";
import { AddBlockedContactModal } from "./Modals/AddBlockedContactModal";
import { AddGroupMembersModal } from "./Modals/AddGroupMembersModal";
import { JoinGroupModal } from "./Modals/JoinGroupModal";
import { NotificationBlockedAlert } from "./Modals/NotificationBlockedAlert";
import { AllMembers } from "./Modals/AllMembers";
import GroupExitModal from "./Modals/GroupExitModal";
import { ViewProfilePictureModal } from "./Modals/ViewProfilePictureModal";
import ImageViewer from "@components/ChatWindow/components/ChatArea/ImageViewer";
import { UploadProfilePictureModal } from "./Modals/UploadProfilePictureModal";

const Modal = () => {
  const modal = useStore((s) => s.modal);
  const setModal = useStore((s) => s.setModal);
  const setSelectedChats = useMessageStore((s) => s.setSelectedChats);

  const children = {
    forwardMessageModal: <ForwardMessageModal title="Forward Message to" />,
    sendLinkModal: <ForwardMessageModal title="Send link to" />,

    deleteMessageModal: <DeleteMessageModal />,
    groupExitModal: <GroupExitModal />,
    addBlockedContactModal: <AddBlockedContactModal />,
    addGroupMembersModal: <AddGroupMembersModal />,
    joinGroupModal: <JoinGroupModal />,
    notificationBlockedAlert: <NotificationBlockedAlert />,
    allMembers: <AllMembers />,
    viewProfilePictureModal: <ViewProfilePictureModal />,
    uploadProfilePictureModal: <UploadProfilePictureModal />,
    imageViewer: <ImageViewer />,
  };

  function handleClose() {
    setModal(null);
    setSelectedChats(null);
    document?.querySelector<HTMLDialogElement>("#action-modal")?.close();
  }

  return (
    <dialog
      onClose={handleClose}
      id="action-modal"
      className="modal outline-none"
    >
      {children[modal?.activeModal as keyof typeof children]}
      <form method="dialog" className="modal-backdrop bg-black/40">
        <button className="outline-none">close</button>
      </form>
    </dialog>
  );
};

export default Modal;
