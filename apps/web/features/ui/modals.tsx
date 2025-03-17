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
import ImageViewer from "./Modals/ImageViewer";
import { DeleteConversationModal } from "./Modals/DeleteConversationModal";
import ViewSessionModal from "./Modals/ViewSessionModal";

export default {
    forwardMessageModal: <ForwardMessageModal title="Forward Message to" />,
    deleteMessageModal: <DeleteMessageModal />,
    deleteConversationModal: <DeleteConversationModal />,
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
    viewSessionModal: <ViewSessionModal />,
  };
