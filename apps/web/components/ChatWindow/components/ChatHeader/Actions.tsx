"use client";
import moment from "moment";
import useSocket from "../../../../context/SocketProvider";
import useAuth from "../../../../hooks/useAuth";
import { useStore } from "../../../../store/global";
import { useMessageStore } from "../../../../store/messageStore";
import {
  ArrowLeftIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  DocumentDuplicateIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { MouseEvent } from "react";
import { useConversationStore } from "store/conversationStore";
import modals from "@components/ui/modals";
import { IModalKey } from "@interfaces/modalInterface";

export default function Actions() {
  const { user: _user } = useAuth();
  const setModal = useStore((s) => s.setModal);
  const {} = useSocket();

  const selectedChats = useMessageStore((s) => s.selectedChats);
  const setSelectedChats = useMessageStore((s) => s.setSelectedChats);

  // const options = [
  //   !!selectedChats.length && {
  //     label: "Clear Selection",
  //     handler: () => setSelectedChats(null),
  //   },
  //   {
  //     label: "Close chat",
  //     handler: () => {
  //       toggleProfile(false);
  //       setSelectedConversation(null);
  //       setSelectedUser(null);
  //     },
  //   },
  //   { label: "Clear chat", handler: handleClearChat },
  //   selectedConversation?.host === "group"
  //     ? { label: "Exit group", handler: handleExitingGroup }
  //     : receiver && {
  //         label: blockedUser ? "Unblock" : "Block",
  //         handler: blockedUser ? handleUnblockingUser : handleBlockingUser,
  //       },
  // ];

  function handleClose(e: MouseEvent<HTMLSpanElement>) {
    e.stopPropagation();
    setSelectedChats(null);
  }

  function handleModal(modal: IModalKey) {
    setModal({ activeModal: modal, state: selectedChats });
    document.querySelector<HTMLDialogElement>("#action-modal")?.showModal();
  }

  function handleCopyingMsg() {
    const selectedConversation =
      useConversationStore.getState().selectedConversation;

    const copiedMessages = selectedChats
      .map(({ timestamp, from, message }) => {
        const receiver = selectedConversation?.members.find(
          (m) => m.id === from
        );
        return [
          moment(new Date(timestamp)).format("D-MM-YY"),
          receiver?.username,
          message,
        ].join(" ");
      })
      .join("\n");

    navigator.clipboard.writeText(copiedMessages);
  }

  return (
    <>
      <div className="text-xs min-h-16 flex items-center gap-4 px-4 ">
        <span
          onClick={handleClose}
          className="sm:hidden btn btn-circle btn-ghost btn-sm"
        >
          <ArrowLeftIcon className="size-5" />
        </span>
        <span className="mr-auto">{selectedChats.length}</span>

        {selectedChats.length === 1 && (
          <span
            onClick={handleClose}
            className="btn btn-circle btn-ghost btn-sm"
          >
            <ArrowUturnLeftIcon className="size-5" />
          </span>
        )}
        <span
          onClick={() => handleModal("deleteMessageModal")}
          className="btn btn-circle btn-ghost btn-sm"
        >
          <TrashIcon className="size-5" />
        </span>
        <span
          onClick={handleCopyingMsg}
          className="btn btn-circle btn-ghost btn-sm"
        >
          <DocumentDuplicateIcon className="size-5" />
        </span>
        <span
          onClick={() => handleModal("forwardMessageModal")}
          className="btn btn-circle btn-ghost btn-sm"
        >
          <ArrowUturnRightIcon className="size-5" />
        </span>
        {/* <Menu
          buttonIcon={
            <span className="btn btn-circle btn-ghost btn-sm">
              <EllipsisVerticalIcon className="size-6" />
            </span>
          }
          menuItems={options}
          placement="bottom-end"
        /> */}
      </div>
    </>
  );
}
