"use client";
import useSocket from "../../../../context/SocketProvider";
import useAuth from "../../../../hooks/useAuth";
import useSelectedConversation from "../../../../hooks/useSelectedConversation";
import { useConversationStore } from "../../../../store/conversationStore";
import { useStore } from "../../../../store/global";
import { useMessageStore } from "../../../../store/messageStore";
import Avatar from "../../../ui/Avatar";
import { getRelativeTime } from "@lib/utils";
import useSelectedUser from "../../../../hooks/useSelectedUser";
import ObjectId from "bson-objectid";
import { ArrowLeftIcon, EllipsisVerticalIcon } from "@heroicons/react/24/solid";
import { useAttachments } from "store/attachments";
import { memo, MouseEvent, useEffect } from "react";
import { useMenu } from "store/menu";
import Menu from "../../../ui/Menu";
import { generateConversation } from "@lib/conversation";
import { IConversation } from "@interfaces/conversationInterface";

function ChatHeader({ showMenu = true }) {
  const { user: currentUser } = useAuth();
  const users = useStore((s) => s.users);
  const setModal = useStore((s) => s.setModal);
  const {
    sendRequestToClearUserConversation,
    sendRequestToClearGroupConversation,
    deleteGroupConversation,
    sendUserBlockRequest,
    sendUserUnBlockRequest,
  } = useSocket();

  const images = useAttachments((s) => s.images);
  const clearImages = useAttachments((s) => s.clearImages);
  const selectedChats = useMessageStore((s) => s.selectedChats);
  const setSelectedChats = useMessageStore((s) => s.setSelectedChats);
  const clearChat = useMessageStore((s) => s.clearChat);
  const updateConversation = useConversationStore((s) => s.updateConversation);
  const deleteConversation = useConversationStore((s) => s.deleteConversation);

  const setSelectedConversation = useConversationStore(
    (s) => s.setSelectedConversation
  );
  const selectedConversation = useSelectedConversation();
  const selectedUser = useSelectedUser();
  const setSelectedUser = useStore((s) => s.setSelectedUser);
  const toggleProfile = useStore((s) => s.toggleProfile);
  const profile = useStore((s) => s.profile);
  const setDeviceTab = useStore((s) => s.setDeviceTab);
  const setMenu = useMenu((s) => s.setMenu);

  const conversationId = selectedConversation?.id!;
  const receiver =
    selectedConversation?.members.find((m) => m.id !== currentUser?.id) ||
    selectedUser;

  const isUserConversation = selectedConversation?.host === "user";

  const blockedConversation =
    isUserConversation && selectedConversation.blocked;
  const blockedByUser =
    isUserConversation && selectedConversation.blockedByUser;
  const isOnline = receiver?.status === "online";
  const isGroup = selectedConversation?.host === "group";
  const isHidden = !receiver?.rules?.profilePicture.isVisible;
  const isGroupMember =
    !isUserConversation &&
    selectedConversation?.members.some((m) => m.id === currentUser?.id);

  const displayName = isGroup
    ? selectedConversation?.displayName
    : receiver?.username;
  const lastSeen = getRelativeTime(receiver?.lastSeen!);

  const handleBlockingUser = () => {
    if (selectedConversation && !isUserConversation) return;
    let conversation =
      selectedConversation || generateConversation(currentUser!, selectedUser!);
    sendUserBlockRequest(conversation, !selectedConversation);
  };

  const handleUnblockingUser = () => {
    isUserConversation && sendUserUnBlockRequest(selectedConversation);
  };

  const handleExitingGroup = () => {
    setModal({ activeModal: "groupExitModal", state: selectedConversation,open:true });
  };

  const handleClearChat = () => {
    clearChat(conversationId);
    updateConversation(conversationId, { recentMessage: null });

    if (isGroup) return sendRequestToClearGroupConversation(conversationId);
    sendRequestToClearUserConversation(conversationId);
  };

  function openProfile() {
    toggleProfile(!profile);
  }

  function handleClose(e: MouseEvent<HTMLSpanElement>) {
    e.stopPropagation();
    if (!!images.length) clearImages();
    else setDeviceTab("");
  }

  const handleOpeningMenu = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setMenu({
      data: selectedConversation,
      reference: e.currentTarget,
      id: "chatHeader",
    });
  };

  function handleClosingChat() {
    toggleProfile(false);
    setSelectedConversation(null);
    setSelectedUser(null);
  }

  function handleDeletingGroupConversation() {
    deleteGroupConversation(selectedConversation!);
  }

  return (
    <>
      <div className="text-xs min-h-16 flex items-center max-sm:px-2 px-4 ">
        <Menu id="chatHeader">
          <>
            <Menu.Item onClick={openProfile}>
              {isGroup ? "Group info" : "Chat info"}
            </Menu.Item>
            {!!selectedChats.length && (
              <Menu.Item onClick={() => setSelectedChats(null)}>
                Clear Selection
              </Menu.Item>
            )}
            <Menu.Item onClick={handleClosingChat}>Close chat</Menu.Item>
            <Menu.Item onClick={handleClearChat}>Clear chat</Menu.Item>
            {isGroup ? (
              isGroupMember ? (
                <Menu.Item onClick={handleExitingGroup}>Exit group</Menu.Item>
              ) : (
                <Menu.Item onClick={handleDeletingGroupConversation}>
                  Delete group
                </Menu.Item>
              )
            ) : (
              receiver && (
                <Menu.Item
                  onClick={
                    blockedConversation
                      ? handleUnblockingUser
                      : handleBlockingUser
                  }
                >
                  {blockedConversation ? "Unblock" : "Block"}
                </Menu.Item>
              )
            )}
          </>
        </Menu>

        <div
          onClick={openProfile}
          className="max-sm:gap-2 sm:gap-4 w-full flex items-center gap-4 cursor-pointer"
        >
          <span
            onClick={handleClose}
            className="sm:hidden btn btn-circle btn-ghost btn-sm"
          >
            <ArrowLeftIcon className="size-5" />
          </span>
          <Avatar
            url={
              isGroup
                ? selectedConversation.profilePicture
                : receiver?.profilePicture
            }
            profileHidden={!isGroup && isHidden}
            size="40px"
            onlineIndication={false}
          />
          <div className="grid gap-1">
            <label className="text-sm truncate" htmlFor="username">
              {displayName}
            </label>
            {!isGroup ? (
              receiver &&
              (isOnline || receiver.rules?.lastSeen.isVisible) &&
              !blockedByUser &&
              !blockedConversation && (
                <label htmlFor="lastseen">
                  {isOnline ? "online" : lastSeen}
                </label>
              )
            ) : (
              <label
                className="pointer-events-none whitespace-nowrap truncate"
                htmlFor="members"
              >
                {selectedConversation.members.map((m, i, a) =>
                  i !== a.length - 1 ? m.username + ", " : m.username
                )}
              </label>
            )}
          </div>
        </div>

        {showMenu && (
          <div
            onClick={handleOpeningMenu}
            tabIndex={0}
            className="btn btn-circle btn-ghost btn-sm"
          >
            <EllipsisVerticalIcon className="size-6" />
          </div>
        )}
      </div>
    </>
  );
}

export default memo(ChatHeader);
