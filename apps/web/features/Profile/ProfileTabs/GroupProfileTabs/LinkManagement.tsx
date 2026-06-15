"use client";

import { useEffect, useState } from "react";
import { useStore } from "../../../../store/global";
import Avatar from "../../../ui/Avatar";
import { useConversationStore } from "../../../../store/conversationStore";
import { IGroupConversation } from "@repo/interfaces/conversationInterface";
import {
  ArrowPathIcon,
  ArrowUturnRightIcon,
  CheckIcon,
  DocumentDuplicateIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";
import { ChevronRightIcon } from "@heroicons/react/24/solid";
import useAuth from "@hooks/useAuth";
import useAxios from "@hooks/useAxios";
import useSelectedConversation from "@hooks/useSelectedConversation";
import { ProfileHeader } from "../SharedComponents/ProfileLayouts";

function LinkManagement({ conversationId }: { conversationId: string }) {
  const conversation = useSelectedConversation<IGroupConversation>();
  const { updateGroupConversation } = useConversationStore((s) => s.groupActions);

  if (!conversation) return null;

  const { user } = useAuth();
  const axios = useAxios();
  const setModal = useStore((s) => s.setModal);
  const profileTab = useStore((s) => s.profileTab);

  const [inviteUrl, setInviteUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const userIdAdmin = conversation.admins.includes(user?.id!);

  useEffect(() => {
    if (typeof window !== "undefined" && conversation.invitationId) {
      setInviteUrl(`${window.location.origin}/invite/${conversation.invitationId}`);
    } else {
      setInviteUrl("");
    }
  }, [conversation.invitationId]);

  function handleSendingInvitationLink() {
    if (!conversation || !inviteUrl) return;
    setModal({
      activeModal: "sendLinkModal",
      state: [
        {
          id: "",
          message: inviteUrl,
        },
      ],
      open: true,
    });
  }

  function handleCopyingLink() {
    if (!conversation || !inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleGeneratingInvitationLink() {
    if (!conversation) return;
    axios
      .patch("/db/group/generateInvitationId", {
        conversationId: conversation.conversationId,
      })
      .then((res) => {
        if (!res) throw Error("Failed to generate group invitation Id");
        const { groupId, invitationId } = res.data;
        const conversationId = useConversationStore
          .getState()
          .conversations.find((c) => c.conversationId === groupId)?.id!;

        updateGroupConversation(conversationId, { invitationId });
      })
      .catch((res) => console.log(res));
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <ProfileHeader title="Invite via link" onBack={() => profileTab.back()} />

      {/* Main Content Area */}
      <div className="w-full h-full flex flex-col bg-linear-to-t from-base-200 max-sm:mt-2 sm:mt-4 overflow-y-auto no-scrollbar max-sm:py-4 py-6">
        {conversation.invitationId ? (
          <div className="flex flex-col gap-6 text-sm">
            {/* Group Profile Info */}
            <div className="flex flex-col items-center text-center px-4 py-4 gap-3">
              <div className="relative">
                <Avatar url={conversation.profilePicture} size="80px" onlineIndication={false} />
                <div className="absolute -bottom-1 -right-1 bg-[--100-primary] text-white p-1.5 rounded-full shadow-md">
                  <LinkIcon className="size-4" />
                </div>
              </div>
              <div className="grid gap-1">
                <h3 className="font-bold text-base text-base-content">{conversation.displayName}</h3>
                <p className="text-xs text-base-content/50">Anyone with this link can join this group.</p>
              </div>
            </div>

            {/* Glassmorphic Invitation Link Card */}
            <div className="px-4">
              <div className="w-full bg-base-100/40 backdrop-blur-md border border-base-content/5 rounded-2xl p-4 flex flex-col gap-3 shadow-xs hover:border-base-content/10 transition-all duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-base-content/50 uppercase tracking-wider">
                    Invitation Link
                  </span>
                  {copied && (
                    <span className="text-xs font-medium text-success flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-200">
                      <CheckIcon className="size-3.5" /> Copied
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-3 bg-base-300/40 hover:bg-base-300/60 border border-base-content/5 rounded-xl pl-3 pr-1.5 py-1.5 transition-all duration-200">
                  <span className="text-xs text-base-content/80 truncate font-mono select-all leading-5">
                    {inviteUrl || "Generating link..."}
                  </span>
                  <button
                    onClick={handleCopyingLink}
                    className="btn btn-sm btn-ghost btn-circle text-base-content/60 hover:text-primary hover:bg-base-content/10 transition-all duration-150 pressable"
                    title="Copy invitation link"
                  >
                    {copied ? (
                      <CheckIcon className="size-4 text-success animate-in zoom-in-50 duration-150" />
                    ) : (
                      <DocumentDuplicateIcon className="size-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="px-4">
              <div className="w-full h-px bg-base-content/5" />
            </div>

            {/* List of Actions */}
            <div className="flex flex-col gap-1.5 px-4 w-full">
              <button
                onClick={handleSendingInvitationLink}
                className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl cursor-pointer hover:bg-[--hover-secondary] transition-colors duration-150 text-left pressable"
              >
                <div className="flex items-center justify-center w-[40px] h-[40px] bg-base-300 text-base-content/70 rounded-full">
                  <ArrowUturnRightIcon className="size-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm text-base-content">Send link</span>
                  <span className="text-xs text-base-content/50">Share link via in-app chat</span>
                </div>
              </button>

              <button
                onClick={handleCopyingLink}
                className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl cursor-pointer hover:bg-[--hover-secondary] transition-colors duration-150 text-left pressable"
              >
                <div className="flex items-center justify-center w-[40px] h-[40px] bg-base-300 text-base-content/70 rounded-full">
                  <DocumentDuplicateIcon className="size-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm text-base-content">Copy link</span>
                  <span className="text-xs text-base-content/50">Copy to your system clipboard</span>
                </div>
              </button>

              {userIdAdmin && (
                <button
                  onClick={handleGeneratingInvitationLink}
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl cursor-pointer hover:bg-[--hover-secondary] transition-colors duration-150 text-left pressable"
                >
                  <div className="flex items-center justify-center w-[40px] h-[40px] bg-error/10 text-error rounded-full">
                    <ArrowPathIcon className="size-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm text-base-content">Reset link</span>
                    <span className="text-xs text-base-content/50">Invalidate current link and generate a new one</span>
                  </div>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col justify-center items-center text-center px-4 py-10 gap-6">
            <div className="w-16 h-16 rounded-full bg-base-300/80 flex items-center justify-center text-base-content/50 shadow-inner">
              <LinkIcon className="size-8" />
            </div>
            <div className="grid gap-2 max-w-sm">
              <h3 className="font-bold text-lg text-base-content">No active invitation link</h3>
              <p className="text-sm text-base-content/60 leading-relaxed">
                Create a secure invite link so others can easily join your group. Anyone with the link will be able to
                enter instantly.
              </p>
            </div>

            <button
              onClick={handleGeneratingInvitationLink}
              className="btn btn-primary btn-wide !text-[--black-white] rounded-2xl shadow-md flex items-center justify-center gap-2 pressable mt-2"
            >
              <LinkIcon className="size-5" />
              Generate Invite Link
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default LinkManagement;
