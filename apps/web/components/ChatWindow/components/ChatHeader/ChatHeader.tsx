"use client";
import useSocket from "../../../../context/SocketProvider";
import useAuth from "../../../../hooks/useAuth";
import useSelectedConversation from "../../../../hooks/useSelectedConversation";
import { useConversationStore } from "../../../../store/conversationStore";
import { useStore } from "../../../../store/global";
import { useMessageStore } from "../../../../store/messageStore";
import { Avatar } from "../../../Dashboard/Components/Avatar";
import { getRelativeTime } from "@lib/utils";
import useSelectedUser from "../../../../hooks/useSelectedUser";
import ObjectId from "bson-objectid";
import Menu from "@components/ui/Menu";
import { EllipsisVerticalIcon } from "@heroicons/react/24/solid";

export default function ChatHeader({ showMenu = true }) {
  const { user: _user } = useAuth();
  const users = useStore((s) => s.users);
  const setModal = useStore((s) => s.setModal);
  const {
    sendRequestToClearUserConversation,
    sendRequestToClearGroupConversation,
    blockedUsers,
    // blockedByUsers,
    sendUserBlockRequest,
    sendUserUnBlockRequest,
  } = useSocket();

  const selectedChats = useMessageStore((s) => s.selectedChats);
  const setSelectedChats = useMessageStore((s) => s.setSelectedChats);
  const clearChat = useMessageStore((s) => s.clearChat);

  const setSelectedConversation = useConversationStore(
    (s) => s.setSelectedConversation
  );
  const selectedConversation = useSelectedConversation();
  const selectedUser = useSelectedUser();
  const setSelectedUser = useStore((s) => s.setSelectedUser);
  const toggleProfile = useStore((s) => s.toggleProfile);
  const profile = useStore((s) => s.profile);

  const conversationId = selectedConversation?.id!;
  const receiver =
    users.find(
      (s) => !s.self && selectedConversation?.members.find((m) => m.id === s.id)
    ) || selectedUser;

  const blockedUser = blockedUsers.find(
    ({ blockedUser }) => blockedUser.id === receiver?.id!
  );
  const blockedByUser = blockedUsers.find(
    ({ user }) => user.id === receiver?.id!
  );

  const handleBlockingUser = () => {
    const req = {
      id: new ObjectId().toHexString(),
      user: _user!,
      blockedUser: receiver!,
    };

    sendUserBlockRequest(req);
  };

  const handleUnblockingUser = () => {
    if (blockedUser) sendUserUnBlockRequest(blockedUser);
  };

  const handleExitingGroup = () => {
    setModal({ activeModal: "groupExitModal" });
    (
      document?.getElementById("action-modal") as HTMLDialogElement
    )?.showModal();
  };

  const handleClearChat = () => {
    clearChat(conversationId);

    let req = {
      conversationId,
      userId: _user?.id!,
      timeOfDeletion: Date.now(),
    };

    if (selectedConversation?.host === "group")
      return sendRequestToClearGroupConversation(req);
    sendRequestToClearUserConversation(req);
  };

  const options = [
    !!selectedChats.length && {
      label: "Clear Selection",
      handler: () => setSelectedChats(null),
    },
    {
      label: "Close chat",
      handler: () => {
        toggleProfile(false);
        setSelectedConversation(null);
        setSelectedUser(null);
      },
    },
    { label: "Clear chat", handler: handleClearChat },
    selectedConversation?.host === "group"
      ? { label: "Exit group", handler: handleExitingGroup }
      : receiver && {
          label: blockedUser ? "Unblock" : "Block",
          handler: blockedUser ? handleUnblockingUser : handleBlockingUser,
        },
  ];

  function openProfile() {
    toggleProfile(!profile);
  }

  const isOnline = receiver?.status === "online";
  const isGroup = selectedConversation?.host === "group";
  const isHidden = !receiver?.rules?.profilePicture.isVisible;

  const displayName = isGroup
    ? selectedConversation?.displayName
    : receiver?.username;
  const lastSeen = getRelativeTime(receiver?.lastSeen!);

  return (
    <>
      <div className="text-xs min-h-16 flex items-center gap-4 px-4 ">
        <div
          onClick={openProfile}
          className="w-full flex items-center gap-4 cursor-pointer"
        >
          <Avatar
            url={
              selectedConversation?.host === "group"
                ? selectedConversation.profilePicture
                : receiver?.profilePicture
            }
            profileHidden={!isGroup && isHidden}
            size="45px"
            onlineIndication={false}
          />
          <div className="grid gap-1">
            <label className="text-sm" htmlFor="username">
              {displayName}
            </label>
            {!isGroup ? (
              receiver &&
              (isOnline || receiver.rules?.lastSeen.isVisible) &&
              !blockedByUser &&
              !blockedUser && (
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
          <Menu
            buttonIcon={
              <span className="btn btn-circle btn-ghost btn-sm">
                <EllipsisVerticalIcon className="size-6" />
              </span>
            }
            menuItems={options}
            placement="bottom-end"
          />
        )}
      </div>
    </>
  );
}
