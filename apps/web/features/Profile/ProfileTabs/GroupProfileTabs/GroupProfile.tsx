"use client";

import { memo, useMemo } from "react";
import useSocket from "../../../../context/SocketProvider";
import { IGroupConversation, IGroupMember } from "@repo/interfaces/conversationInterface";
import { useStore } from "../../../../store/global";
import MediaSelection from "../SharedComponents/MediaSelection";
import Menu from "@features/ui/Menu";
import { ChevronRightIcon, LinkIcon } from "@heroicons/react/24/solid";
import NotificationToggle from "../SharedComponents/NotificationToggle";
import StarredMessages from "../SharedComponents/StarredMessages";
import TextInput from "@features/ui/TextInput";
import TagInput from "@features/ui/TagInput";
import useSelectedConversation from "@hooks/useSelectedConversation";
import { UserPlusIcon } from "@heroicons/react/24/outline";
import { Member } from "./components/Member";
import { AvatarWrapper } from "./components/AvatarWrapper";
import { IModalKey } from "@interfaces/modalInterface";
import useAuth from "@hooks/useAuth";
import { getUserFromMetadata } from "@lib/conversation";

function GroupProfile() {
  const conversation = useSelectedConversation<IGroupConversation>();
  const { user } = useAuth();

  if (!conversation) return;

  const {
    removeMemberFromGroup,
    sendGroupConversationDeleteRequest,
    makeAdmin,
    removeFromAdmin,
    sendGroupInfoUpdateRequest,
    addGroupTag,
    removeGroupTag,
  } = useSocket();

  const setModal = useStore((s) => s.setModal);
  const profileTab = useStore((s) => s.profileTab);

  function closeProfile() {
    profileTab.back();
  }

  const members = useMemo(() => sortGroupMembers([...conversation.members]), [conversation.members.length]);

  const userIsAdmin = conversation.admins.includes(user?.id!);
  const userIsMember = conversation.members.some((m) => m.userId === user?.id!);
  const userCanEdit = userIsAdmin && userIsMember;
  const totalMembers = conversation.members.length;

  function sortGroupMembers(members: IGroupMember[]) {
    if (!members) return [];
    return members.sort((a, b) => {
      if (a.isAdmin && !b.isAdmin) return -1;
      if (!a.isAdmin && b.isAdmin) return 1;
      const usernameA = (getUserFromMetadata(a)?.username || "").toLowerCase();
      const usernameB = (getUserFromMetadata(b)?.username || "").toLowerCase();

      return usernameA.localeCompare(usernameB);
    });
  }

  function handleEditGroupName(displayName: string) {
    if (displayName !== conversation?.displayName)
      sendGroupInfoUpdateRequest(conversation!, { displayName: displayName });
  }

  function handleEditGroupDescription(description: string) {
    if (description !== conversation?.desc) sendGroupInfoUpdateRequest(conversation!, { desc: description });
  }

  function toggleModal(activeModal: IModalKey) {
    setModal({ activeModal, open: true });
  }

  function handleExitingGroup() {
    setModal({
      activeModal: "groupExitModal",
      state: conversation,
      open: true,
    });
  }

  function handleDeletingGroup() {
    sendGroupConversationDeleteRequest({
      groupId: conversation?.conversationId!,
      conversationId: conversation?.id!,
      channelId: conversation?.channelId!,
      userId: user?.id!,
    });
  }

  function handleAdmin(userId: string, action: string) {
    if (action === "add") makeAdmin(conversation!, userId);
    else removeFromAdmin(conversation!, userId);
  }

  function handleRemovingMember(user: IGroupMember) {
    removeMemberFromGroup(conversation!, user, user._id);
  }

  function handleAddingTag(tag: string) {
    addGroupTag({
      conversation: conversation!,
      tag,
    });
  }

  function handleRemovingTag(tag: string) {
    removeGroupTag({
      conversation: conversation!,
      tag,
    });
  }

  return (
    <div className="w-full h-full grid">
      {/* Header */}
      <div className="min-h-16 w-full flex items-center max-sm:gap-2 gap-4 max-sm:px-2 px-4">
        <button onClick={closeProfile} className={`btn btn-sm btn-ghost btn-circle`}>
          <ChevronRightIcon className="size-5" />
        </button>
        <label htmlFor="contact info">Group info</label>
      </div>

      {/* Profile details */}
      <div className="flex relative h-full gap-8 max-sm:pt-2 pt-4 text-sm flex-col overflow-y-scroll max-sm:pb-3 pb-10 no-scrollbar">
        {/* profile */}
        <div className="flex gap-8 items-center max-sm:px-4 px-8">
          <AvatarWrapper conversation={conversation} userIsAdmin={userCanEdit} />

          <div className="grid gap-1">
            <TextInput
              text={conversation?.displayName!}
              className="text-base"
              placeholderText="Add group description"
              onSubmit={handleEditGroupName}
              canEdit={userCanEdit}
            />
            <label className="text-xs text-base-content/50" htmlFor="">
              {"Created By " + conversation.createdBy}
            </label>
          </div>
        </div>

        {(conversation.desc || !!conversation.tags?.length) && (
          <div className="flex flex-col gap-4">
            {(conversation.desc || userCanEdit) && (
              <div className="max-sm:px-4 px-8">
                <TextInput
                  autoRaw
                  placeholderText="Add group description"
                  text={conversation?.desc!}
                  onSubmit={handleEditGroupDescription}
                  canEdit={userCanEdit}
                />
              </div>
            )}

            {(!!conversation.tags?.length || userCanEdit) && (
              <div className="max-sm:px-4 px-8">
                <TagInput
                  tags={conversation.tags || []}
                  showLabel={false}
                  canEdit={userCanEdit}
                  onSubmit={handleAddingTag}
                  onDelete={handleRemovingTag}
                />
              </div>
            )}
          </div>
        )}

        {/* Media */}
        <div className="space-y-1 divide-y-[1.75px] divide-[--base-300-400] max-sm:mt-2 sm:mt-4 max-sm:px-4 px-8 [&>div]:h-16">
          <NotificationToggle id={conversation.id} />
          <StarredMessages />
          <MediaSelection conversationId={conversation?.id!} />
        </div>

        {/* conversation members */}
        <div className="w-full flex flex-col ">
          <Menu<IGroupMember> id="groupProfile">
            {(member) => (
              <>
                <Menu.Item onClick={() => handleAdmin(member.userId!, member.isAdmin ? "remove" : "add")}>
                  {member.isAdmin ? "Remove Admin" : "Make Admin"}
                </Menu.Item>
                <Menu.Item onClick={() => handleRemovingMember(member)}>Remove</Menu.Item>
              </>
            )}
          </Menu>

          <div className="flex gap-4 max-sm:px-4 px-8">
            <label className="text-sm text-primary mb-2 " htmlFor="">
              Group members
            </label>
            {totalMembers}
          </div>

          <div className="flex gap-1 flex-col w-full ">
            {userCanEdit && (
              <>
                <div
                  tabIndex={0}
                  onClick={() => toggleModal("addGroupMembersModal")}
                  className="hover:bg-[--hover-secondary] duration-200  w-full flex items-center gap-4 max-sm:px-4 px-8 py-3 cursor-pointer"
                >
                  <div className="flex items-center justify-center w-[40px] h-[40px] bg-[--100-primary] text-white rounded-full">
                    <UserPlusIcon className="size-5" />
                  </div>
                  Add Member
                </div>
                <div
                  onClick={() => profileTab.push("inviteLink")}
                  tabIndex={0}
                  className="hover:bg-[--hover-secondary] duration-200  w-full flex items-center gap-4 max-sm:px-4 px-8 py-3 cursor-pointer"
                >
                  <div className="flex items-center justify-center w-[40px] h-[40px] bg-[--100-primary] text-white rounded-full">
                    <LinkIcon className="size-5" />
                  </div>
                  Invite via link
                </div>
                <div className="max-sm:px-4 px-8 py-2">
                  <div className="w-full h-[1.25px] bg-[--base-300-400]"></div>
                </div>
              </>
            )}

            <div>
              {members.map(
                (member, i) =>
                  i < 5 && (
                    <Member
                      isAdmin={conversation.admins.includes(member.userId)}
                      showOptions={userIsAdmin}
                      key={member.userId}
                      member={member}
                    />
                  )
              )}
            </div>
            <div
              onClick={() => toggleModal("allMembers")}
              tabIndex={0}
              className="hover:bg-[--hover-secondary] duration-200  p-4 flex justify-center items-center cursor-pointer"
            >
              View all members
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 max-sm:px-4 px-8 mt-auto">
          <div
            onClick={userIsMember ? handleExitingGroup : handleDeletingGroup}
            tabIndex={0}
            className="btn btn-block btn-error !text-[--black-white]"
          >
            {userIsMember ? "Exit Group" : "Delete chat"}
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(GroupProfile);
