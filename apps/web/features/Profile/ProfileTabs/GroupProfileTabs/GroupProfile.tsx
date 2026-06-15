"use client";

import Menu from "@features/ui/Menu";
import TagInput from "@features/ui/TagInput";
import TextInput from "@features/ui/TextInput";
import { UserPlusIcon } from "@heroicons/react/24/outline";
import { ChevronRightIcon, LinkIcon } from "@heroicons/react/24/solid";
import useAuth from "@hooks/useAuth";
import useGroupConversation from "@hooks/useGroupConversation";
import { IModalKey } from "@interfaces/modalInterface";
import { getUserFromMetadata } from "@lib/conversation";
import { IGroupMember } from "@repo/interfaces/conversationInterface";
import { memo, useMemo } from "react";
import useSocket from "../../../../context/SocketProvider";
import { useStore } from "../../../../store/global";
import MediaSelection from "../SharedComponents/MediaSelection";
import NotificationToggle from "../SharedComponents/NotificationToggle";
import StarredMessages from "../SharedComponents/StarredMessages";
import { AvatarWrapper } from "./components/AvatarWrapper";
import { Member } from "./components/Member";
import { ProfileHeader, ProfileCard } from "../SharedComponents/ProfileLayouts";

function GroupProfile({ groupId }: { groupId: string }) {
  const conversation = useGroupConversation(groupId);
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

  function handleRemovingMember(member: IGroupMember) {
    if (!conversation) return;
    if (!member) return;

    removeMemberFromGroup(conversation, member);
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
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <ProfileHeader title="Group info" onBack={closeProfile} />

      {/* Profile details */}
      <div className="flex-1 flex relative gap-6 pt-4 text-sm flex-col overflow-y-auto pb-10 no-scrollbar">
        {/* Profile Card */}
        <div className="flex gap-6 items-center px-4 py-4 border-b border-base-content/5">
          <AvatarWrapper conversation={conversation} userIsAdmin={userCanEdit} />

          <div className="grid gap-1.5 flex-1 min-w-0">
            <TextInput
              text={conversation?.displayName!}
              className="text-lg font-bold text-base-content"
              placeholderText="Add group name"
              onSubmit={handleEditGroupName}
              canEdit={userCanEdit}
            />
            <span className="text-xs text-base-content/40">Created by {conversation.createdBy}</span>
          </div>
        </div>

        {/* Group Details Card */}
        {(conversation.desc || !!conversation.tags?.length || userCanEdit) && (
          <ProfileCard title="Group Details">
            {(conversation.desc || userCanEdit) && (
              <div className="flex flex-col gap-1">
                <span className="text-xs text-base-content/40 font-medium pl-0.5">Description</span>
                <TextInput
                  autoRaw
                  placeholderText="Add group description..."
                  text={conversation?.desc!}
                  onSubmit={handleEditGroupDescription}
                  canEdit={userCanEdit}
                />
              </div>
            )}

            {(!!conversation.tags?.length || userCanEdit) && (
              <div className="flex flex-col gap-1.5 mt-1">
                <span className="text-xs text-base-content/40 font-medium pl-0.5">Tags</span>
                <TagInput
                  tags={conversation.tags || []}
                  showLabel={false}
                  canEdit={userCanEdit}
                  onSubmit={handleAddingTag}
                  onDelete={handleRemovingTag}
                />
              </div>
            )}
          </ProfileCard>
        )}

        {/* Preferences & Shared Media Card */}
        <ProfileCard title="Preferences & Media" variant="list">
          <NotificationToggle id={conversation.id} />
          <StarredMessages />
          <MediaSelection conversationId={conversation?.id!} />
        </ProfileCard>

        {/* Group Members Section */}
        <div className="flex flex-col gap-2 px-4">
          <Menu<IGroupMember> id="groupProfile">
            {(member) => (
              <>
                <Menu.Item onClick={() => handleAdmin(member.userId!, member?.isAdmin ? "remove" : "add")}>
                  {member?.isAdmin ? "Remove Admin" : "Make Admin"}
                </Menu.Item>
                <Menu.Item onClick={() => handleRemovingMember(member)}>Remove</Menu.Item>
              </>
            )}
          </Menu>

          <div className="flex items-center justify-between pl-1">
            <span className="text-xs font-semibold text-base-content/50 uppercase tracking-wider">Group Members</span>
            <span className="badge badge-sm bg-base-300 border-none text-base-content/70 font-semibold px-2 py-2 rounded-full">
              {totalMembers}
            </span>
          </div>

          <div className="bg-base-100/20 backdrop-blur-md rounded-2xl py-4 flex flex-col gap-2 shadow-xs">
            {userCanEdit && (
              <>
                <button
                  tabIndex={0}
                  onClick={() => toggleModal("addGroupMembersModal")}
                  className="hover:bg-[--hover-secondary] transition-colors duration-150 w-full flex items-center gap-4 px-4 py-3 text-left pressable"
                >
                  <div className="flex items-center justify-center w-[36px] h-[36px] bg-base-300 text-base-content/70 rounded-full shrink-0">
                    <UserPlusIcon className="size-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm text-base-content">Add Member</span>
                    <span className="text-xs text-base-content/50">Add someone directly to this group</span>
                  </div>
                </button>

                <button
                  onClick={() => profileTab.push("inviteLink")}
                  tabIndex={0}
                  className="hover:bg-[--hover-secondary] transition-colors duration-150 w-full flex items-center gap-4 px-4 py-3 text-left pressable"
                >
                  <div className="flex items-center justify-center w-[36px] h-[36px] bg-base-300 text-base-content/70 rounded-full shrink-0">
                    <LinkIcon className="size-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm text-base-content">Invite via link</span>
                    <span className="text-xs text-base-content/50">Share a link to let people join</span>
                  </div>
                </button>

                <div className="px-4 py-1.5">
                  <div className="w-full h-px bg-base-content/5"></div>
                </div>
              </>
            )}

            <div className="flex flex-col gap-0.5">
              {members.map(
                (member, i) =>
                  i < 5 && (
                    <Member
                      isAdmin={conversation.admins.includes(member.userId)}
                      showOptions={userIsAdmin}
                      key={member.userId}
                      member={member}
                    />
                  ),
              )}
            </div>

            <div className="px-4">
              <button
                onClick={() => toggleModal("allMembers")}
                className="hover:bg-[--hover-secondary] text-primary font-semibold transition-all duration-150 py-2.5 w-full flex justify-center items-center rounded-xl pressable mt-1"
              >
                View all members
              </button>
            </div>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="flex flex-col gap-2 px-4 mt-auto pt-6">
          <button
            onClick={userIsMember ? handleExitingGroup : handleDeletingGroup}
            className="btn btn-block btn-error !text-[--black-white] rounded-2xl shadow-sm font-bold py-3.5 pressable"
          >
            {userIsMember ? "Exit Group" : "Delete chat"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(GroupProfile);
