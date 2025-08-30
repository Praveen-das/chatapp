"use client";
import { MouseEvent, useMemo, useState } from "react";
import { uploadImage } from "@lib/imageKit";
import { useMenu } from "store/menu";
import Menu from "@features/ui/Menu";
import Avatar from "@features/ui/Avatar";
import { IGroupConversation } from "@repo/interfaces/conversationInterface";
import useSocket from "context/SocketProvider";
import { useStore } from "store/global";

export function AvatarWrapper({ conversation, userIsAdmin }: { conversation: IGroupConversation; userIsAdmin: boolean; }) {
  const { sendGroupInfoUpdateRequest } = useSocket();
  const setMenu = useMenu((s) => s.setMenu);
  const setModal = useStore((s) => s.setModal);

  const [loading, setLoading] = useState(false);

  const handleDropdown = (e: MouseEvent<HTMLDivElement>) => {
    setMenu({ id: "GROUP_PROFILE", reference: e });
  };

  function handleUpdatingProfilePicture(base64: string) {
    setLoading(true);
    uploadImage(base64, conversation.conversationId, true).then((res) => {
      sendGroupInfoUpdateRequest(conversation, { profilePicture: res.url });
      setLoading(false);
    });
  }

  const options = useMemo(() => {
    return [
      {
        label: "View image",
        handler: openViewProfilePictureModal,
      },
      {
        label: "Change image",
        handler: () => document.getElementById("group_avatar")?.click(),
      },
      {
        label: "Delete image",
        handler: handleDeletingProfilePicture,
      },
    ];
  }, []);

  function handleDeletingProfilePicture() {
    sendGroupInfoUpdateRequest(conversation, { profilePicture: "" });
  }

  function openViewProfilePictureModal() {
    setModal({
      activeModal: "viewProfilePictureModal",
      state: {
        url: conversation.profilePicture,
        displayName: conversation.displayName,
      },
      open: true,
    });
  }

  return (
    <div className="relative">
      <Menu id="GROUP_PROFILE" clientPoint>
        {options.map(({ handler, label }) => (
          <Menu.Item key={label} onClick={handler}>
            {label}
          </Menu.Item>
        ))}
      </Menu>

      <Avatar
        id="group_avatar"
        size="120px"
        url={conversation.profilePicture}
        onlineIndication={false}
        loading={loading}
        onClick={handleDropdown}
        onChange={handleUpdatingProfilePicture}
        enableOptions={userIsAdmin} />
    </div>
  );
}
