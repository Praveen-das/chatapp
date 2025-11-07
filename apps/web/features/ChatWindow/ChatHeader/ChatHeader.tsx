"use client";
import { ArrowLeftIcon, EllipsisVerticalIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { IGroupConversation, IUserConversation } from "@repo/interfaces/conversationInterface";
import { generateConversation, generateUserConversations, handleGeneratingConversation } from "@repo/utils/index";
import { getParticipant } from "@lib/conversation";
import { getRelativeTime } from "@lib/utils";
import { MouseEvent, memo, useMemo } from "react";
import { useAttachments } from "store/attachments";
import { useMenu } from "store/menu";
import useSocket from "../../../context/SocketProvider";
import useAuth from "../../../hooks/useAuth";
import useSelectedConversation from "../../../hooks/useSelectedConversation";
import { useConversationStore } from "../../../store/conversationStore";
import { useStore } from "../../../store/global";
import { useMessageStore } from "../../../store/messageStore";
import Avatar from "../../ui/Avatar";
import Menu from "../../ui/Menu";
import { APP_NAME } from "config/constants";

const { setDeviceTab, setSelectedUser } = useStore.getState();

function openProfile() {
  const { profile, profileTab, selectedUser } = useStore.getState();

  if (profile) {
    profileTab.back();
    if (useConversationStore.getState().selectedConversation) setSelectedUser(null);
  } else {
    selectedUser ? profileTab.push("user") : profileTab.push("conversation");
  }
}

function ChatHeader({ showMenu = true, onClose }: { showMenu: boolean; onClose?: () => void }) {
  const images = useAttachments((s) => s.images);
  const clearImages = useAttachments((s) => s.clearImages);
  const setMenu = useMenu((s) => s.setMenu);

  const conversationId = useConversationStore((s) => s.selectedConversation)?.id!;
  const selectedConversation = useSelectedConversation(conversationId);

  const isUserConversation = selectedConversation?.host === "user";
  const isGroupConversation = selectedConversation?.host === "group";
  const isSystem = selectedConversation?.host === "system";

  function handleClose(e: MouseEvent<HTMLSpanElement>) {
    e.stopPropagation();
    !!images.length ? clearImages() : setDeviceTab("");
  }

  const handleOpeningMenu = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setMenu({
      data: selectedConversation,
      reference: e,
      id: "chatHeader",
    });
  };

  return (
    <div className="text-xs min-h-16 flex items-center max-sm:px-2 px-4">
      <HeaderMenuContext />

      <div onClick={openProfile} className="max-sm:gap-2 sm:gap-4 w-full flex items-center gap-4 cursor-pointer">
        <span onClick={handleClose} className="sm:hidden btn btn-circle btn-ghost btn-sm">
          <ArrowLeftIcon className="size-5" />
        </span>
        {isGroupConversation ? (
          <GroupInfo conversationId={conversationId} />
        ) : isUserConversation ? (
          <UserInfo conversationId={conversationId} />
        ) : isSystem ? (
          <SystemInfo />
        ) : null}
      </div>

      {showMenu && (
        <div onClick={handleOpeningMenu} tabIndex={0} className="btn btn-circle btn-ghost btn-sm">
          <EllipsisVerticalIcon className="size-6 pointer-events-none" />
        </div>
      )}

      {onClose && (
        <div onClick={onClose} tabIndex={0} className="btn btn-circle btn-ghost btn-sm">
          <XMarkIcon className="size-6 pointer-events-none" />
        </div>
      )}
    </div>
  );
}

function SystemInfo() {
  return (
    <>
      <Avatar url="/favicon.svg" size="40px" onlineIndication={false} />
      <div className="grid gap-1">
        <label className="text-sm truncate" htmlFor="username">
          {APP_NAME}
        </label>
        <label htmlFor="lastseen">System notifications</label>
      </div>
    </>
  );
}

function UserInfo({ conversationId }: { conversationId: string }) {
  const selectedUser = useStore((s) => s.selectedUser);
  const selectedConversation = useSelectedConversation<IUserConversation>(conversationId);

  const receiver = useMemo(
    () => getParticipant(selectedConversation!) || selectedUser,
    [selectedConversation, selectedUser]
  );

  if (!receiver) return null;

  const { username, profilePicture, rules, status } = receiver;
  const lastSeen = getRelativeTime(receiver?.lastSeen!);
  const isOnline = status === "online";
  const isHidden = Boolean(rules?.includes("hide_profilepicture"));
  const canShowLastSeen =
    (isOnline || !rules?.includes("hide_lastseen")) &&
    !selectedConversation?.blockedByUser &&
    !selectedConversation?.blocked;

  return (
    <>
      <Avatar url={profilePicture} profileHidden={isHidden} size="40px" onlineIndication={false} />
      <div className="grid gap-1">
        <label className="text-sm truncate" htmlFor="username">
          {username}
        </label>
        {canShowLastSeen && <label htmlFor="lastseen">{isOnline ? "online" : lastSeen}</label>}
      </div>
    </>
  );
}

function GroupInfo({ conversationId }: { conversationId: string }) {
  const selectedConversation = useSelectedConversation<IGroupConversation>(conversationId);

  if (!selectedConversation) return null;

  return (
    <>
      <Avatar url={selectedConversation.profilePicture} size="40px" onlineIndication={false} />
      <div className="grid gap-1">
        <label className="text-sm truncate" htmlFor="username">
          {selectedConversation.displayName}
        </label>
        <label className="pointer-events-none whitespace-nowrap truncate" htmlFor="members">
          {selectedConversation?.members.map((m, i, a) => (i !== a.length - 1 ? `${m.username}, ` : m.username))}
        </label>
      </div>
    </>
  );
}

function HeaderMenuContext() {
  const {
    sendRequestToClearUserConversation,
    sendRequestToClearGroupConversation,
    sendGroupConversationDeleteRequest,
    sendUserBlockRequest,
    sendUserUnBlockRequest,
    sendRequestToRegisterConversation,
  } = useSocket();

  const currentUser = useAuth().user;
  const selectedUser = useStore((s) => s.selectedUser);
  const conversationId = useConversationStore((s) => s.selectedConversation)?.id!;

  const selectedConversation = useSelectedConversation(conversationId);
  const isGroupConversation = selectedConversation?.host === "group";
  const isUserConversation = selectedConversation?.host === "user";
  const isSystemConversation = selectedConversation?.host === "system";
  const isBlocked = isUserConversation && selectedConversation.blocked;
  const isGroupMember = isGroupConversation && selectedConversation?.members.some((m) => m.id === currentUser?.id);

  const selectedChats = useMessageStore((s) => s.selectedChats);

  const setModal = useStore((s) => s.setModal);
  const toggleProfile = useStore((s) => s.toggleProfile);
  const setSelectedChats = useMessageStore((s) => s.setSelectedChats);
  const { setSelectedConversation } = useConversationStore((s) => s.conversationActions);
  const setSelectedUser = useStore((s) => s.setSelectedUser);

  const handleBlockingUser = () => {
    if (selectedConversation?.host === "group") return;
    if (isSystemConversation) return;

    if (selectedConversation)
      return sendUserBlockRequest(selectedConversation);

    sendRequestToRegisterConversation([currentUser!, selectedUser!], {
      blocked: [currentUser?.id!],
    });
  };

  const handleUnblockingUser = () => {
    isUserConversation && sendUserUnBlockRequest(selectedConversation!);
  };

  const handleExitingGroup = () => {
    setModal({
      activeModal: "groupExitModal",
      state: selectedConversation,
      open: true,
    });
  };

  const handleClearChat = () => {
    isGroupConversation
      ? sendRequestToClearGroupConversation({
          conversationId: conversationId!,
          groupId: selectedConversation.conversationId!,
          userId: currentUser?.id!,
          recentMember: selectedConversation.currentParticipation?._id!,
        })
      : sendRequestToClearUserConversation(conversationId);
  };

  function handleClosingChat() {
    toggleProfile(false);
    setSelectedConversation(null);
    setSelectedUser(null);
  }

  function handleDeletingGroupConversation() {
    if (selectedConversation?.host === "group") {
      const { id, conversationId, channelId } = selectedConversation;
      sendGroupConversationDeleteRequest({
        conversationId: id,
        groupId: conversationId,
        channelId: channelId!,
        userId: currentUser?.id!,
      });
    }
  }

  return (
    <Menu id="chatHeader" placement="bottom-end">
      <Menu.Item onClick={openProfile}>{isGroupConversation ? "Group info" : "Chat info"}</Menu.Item>
      {!!selectedChats.length && <Menu.Item onClick={() => setSelectedChats(null)}>Clear Selection</Menu.Item>}
      <Menu.Item onClick={handleClosingChat}>Close chat</Menu.Item>
      <Menu.Item onClick={handleClearChat}>Clear chat</Menu.Item>
      {!isSystemConversation &&
        (isUserConversation ? (
          <Menu.Item onClick={isBlocked ? handleUnblockingUser : handleBlockingUser}>
            {isBlocked ? "Unblock" : "Block"}
          </Menu.Item>
        ) : isGroupMember ? (
          <Menu.Item onClick={handleExitingGroup}>Exit group</Menu.Item>
        ) : (
          <Menu.Item onClick={handleDeletingGroupConversation}>Delete group</Menu.Item>
        ))}
    </Menu>
  );
}

export default memo(ChatHeader);
