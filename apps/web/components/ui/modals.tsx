import { ForwardMessageModal } from "./Modals/ForwardMessageModal";
import { DeleteMessageModal } from "./Modals/DeleteMessageModal";
import { AddBlockedContactModal } from "./Modals/AddBlockedContactModal";
import { AddGroupMembersModal } from "./Modals/AddGroupMembersModal";
import { JoinGroupModal } from "./Modals/JoinGroupModal";
import { NotificationBlockedAlert } from "./Modals/NotificationBlockedAlert";
import { AllMembers } from "./Modals/AllMembers";
import GroupExitModal from "./Modals/GroupExitModal";
import { ViewProfilePictureModal } from "./Modals/ViewProfilePictureModal";
import { UploadProfilePictureModal } from "./Modals/UploadProfilePictureModal";
import ImageViewer from "@components/ChatWindow/components/ChatArea/ImageViewer";

export default {
    forwardMessageModal: <ForwardMessageModal title="Forward Message to" />,
    deleteMessageModal: <DeleteMessageModal />,
    addBlockedContactModal: <AddBlockedContactModal />,
    notificationBlockedAlert: <NotificationBlockedAlert />,
    viewProfilePictureModal: <ViewProfilePictureModal />,
    uploadProfilePictureModal: <UploadProfilePictureModal />,
    imageViewer: <ImageViewer />,
    
    sendLinkModal: <ForwardMessageModal title="Send link to" />,
    groupExitModal: <GroupExitModal />,
    addGroupMembersModal: <AddGroupMembersModal />,
    joinGroupModal: <JoinGroupModal />,
    allMembers: <AllMembers />,
  };
