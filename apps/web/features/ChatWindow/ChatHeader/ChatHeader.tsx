"use client";
import { ArrowLeftIcon, EllipsisVerticalIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { IGroupConversation } from "@repo/interfaces/conversationInterface";
import { getMemberById, getReceiverMetadata, getUserById } from "@lib/conversation";
import { getRelativeTime } from "@lib/utils";
import { MouseEvent, memo, useEffect, useMemo, useState } from "react";
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
import { IUser } from "@repo/interfaces/userInterface";
import { SparkSolid } from "iconoir-react";
import moment from "moment";
import useUser from "@hooks/useUser";

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
  const selectedConversation = useSelectedConversation();

  const selectedUser = useStore((s) => s.selectedUser);
  const receiver = getReceiverMetadata(selectedConversation!);
  const userId = selectedUser?.id || receiver?.userId;

  const isUserConversation = selectedConversation?.host === "user";
  const isGroupConversation = selectedConversation?.host === "group";
  const isSystem = selectedConversation?.host === "system";
  const isAiConversation = selectedConversation?.host === "ai";

  function handleClose(e: MouseEvent<HTMLSpanElement>) {
    e.stopPropagation();
    useConversationStore.getState().conversationActions.setSelectedConversation(null);
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
          <GroupInfo />
        ) : isUserConversation ? (
          <UserInfo
            userId={userId!}
            blocked={Boolean(selectedConversation.blocked)}
            blockedByUser={Boolean(selectedConversation.blockedByUser)}
          />
        ) : isSystem ? (
          <SystemInfo />
        ) : isAiConversation ? (
          <AiInfo />
        ) : null}
      </div>

      {showMenu && !isAiConversation && (
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
        <label className="text-sm font-medium truncate" htmlFor="username">
          {APP_NAME}
        </label>
        <span className="text-xs opacity-60">System notifications</span>
      </div>
    </>
  );
}

function AiInfo() {
  return (
    <>
      <div className="avatar">
        <SparkSolid className="size-10 text-primary" />
      </div>
      <div className="grid gap-1">
        <label className="text-sm font-medium truncate" htmlFor="username">
          AI Assistant
        </label>
        <span className="text-xs opacity-60">Powered by Google Gemini</span>
      </div>
    </>
  );
}

function UserInfo({ userId, blocked, blockedByUser }: { userId: string; blocked: boolean; blockedByUser: boolean }) {
  const user = useUser(userId);

  const { getUserStatus } = useSocket();

  useEffect(() => {
    if (!user?.id) return;
    getUserStatus(user.id, (data) => {
      if (!data) return;

      const { updateUserStatus } = useStore.getState();

      updateUserStatus(data.userId, data.status, Number(data.lastSeen));
    });
  }, [user?.id]);

  if (!user) {
    return (
      <>
        <Avatar url={undefined} size="40px" onlineIndication={false} />
        <div className="grid gap-1">
          <label className="text-sm truncate" htmlFor="username">
            Loading...
          </label>
        </div>
      </>
    );
  }

  const { username, profilePicture, rules } = user;

  const isOnline = user.status === "online";
  const isHidden = Boolean(rules?.includes("hide_profilepicture"));
  const canShowLastSeen =
    isOnline || (user.lastSeen !== null && user.lastSeen !== undefined && !isNaN(Number(user.lastSeen)));

  return (
    <>
      <Avatar url={profilePicture} profileHidden={isHidden} size="40px" onlineIndication={false} />
      <div className="grid gap-1">
        <label className="text-sm font-medium truncate" htmlFor="username">
          {username}
        </label>
        {canShowLastSeen && (
          <span className="text-xs opacity-60">{isOnline ? "online" : moment(user.lastSeen).fromNow()}</span>
        )}
      </div>
    </>
  );
}

function GroupInfo() {
  const selectedConversation = useSelectedConversation<IGroupConversation>();

  if (!selectedConversation) return null;

  return (
    <>
      <Avatar url={selectedConversation.profilePicture} size="40px" onlineIndication={false} />
      <div className="grid gap-1">
        <label className="text-sm font-medium truncate" htmlFor="username">
          {selectedConversation.displayName}
        </label>
        <span
          className="text-xs opacity-60 pointer-events-none whitespace-nowrap truncate max-w-[200px]"
          title={selectedConversation?.members.map((m) => getUserById(m.userId)?.username || "").join(", ")}
        >
          {selectedConversation?.members.map((m, i, a) => {
            let displayName = getUserById(m.userId)?.username || "";
            return i !== a.length - 1 ? `${displayName}, ` : displayName;
          })}
        </span>
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

  const currentUser = useAuth().user!;
  const selectedUser = useStore((s) => s.selectedUser);

  const selectedConversation = useSelectedConversation();
  const isGroupConversation = selectedConversation?.host === "group";
  const isUserConversation = selectedConversation?.host === "user";
  const isSystemConversation = selectedConversation?.host === "system";

  const isBlocked = isUserConversation && selectedConversation.blocked;
  const isGroupMember = isGroupConversation && selectedConversation?.members.some((m) => m.userId === currentUser?.id);

  const selectedChats = useMessageStore((s) => s.selectedChats);

  const setModal = useStore((s) => s.setModal);
  const toggleProfile = useStore((s) => s.toggleProfile);
  const setSelectedChats = useMessageStore((s) => s.setSelectedChats);
  const { setSelectedConversation } = useConversationStore((s) => s.conversationActions);
  const setSelectedUser = useStore((s) => s.setSelectedUser);

  const handleBlockingUser = () => {
    if (selectedConversation?.host === "group") return;
    if (selectedConversation?.host === "ai") return;
    if (selectedConversation?.host === "system") return;

    if (selectedConversation) return sendUserBlockRequest(selectedConversation);

    sendRequestToRegisterConversation(
      { currentUser, participant: selectedUser! },
      {
        blocked: [currentUser?.id!],
      },
    );
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
    if (isGroupConversation) {
      const member = getMemberById(selectedConversation, currentUser?.id);
      if (!member) return;

      sendRequestToClearGroupConversation({
        conversationId: selectedConversation.id!,
        groupId: selectedConversation.conversationId!,
        userId: currentUser?.id!,
        recentMember: member._id!,
      });

      return;
    }
    sendRequestToClearUserConversation(selectedConversation!.id);
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
