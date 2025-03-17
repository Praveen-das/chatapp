"use client";

import { MouseEvent, memo } from "react";
import Avatar from "@features/ui/Avatar";
import { IImageAttachment, IMessage, IMessageReply, IUrlAttachment } from "@interfaces/messageInterface";
import ImageAttachment from "./Attachments/ImageAttachment";
import UrlAttachment from "./Attachments/UrlAttachment";
import { ArrowUturnLeftIcon } from "@heroicons/react/24/solid";
import { EllipsisVerticalIcon } from "@heroicons/react/24/solid";
import { decrypt } from "@lib/e2e";
import { ChatIndicators } from "./ChatIndicators/ChatIndicators";
import { DeletedMessage } from "./Message/DeletedMessage";
import { ReplyMessage } from "./Message/ReplyMessage";
import { RenderMessage } from "./Message/RenderMessage";
import { matchEmoji } from "@lib/emojies";
import classnames from "classnames";
import { useMenu } from "store/menu";
import { useMessageStore } from "store/messageStore";
import classNames from "classnames";
import { useStore } from "store/global";
import { IUser } from "@interfaces/userInterface";
import { useConversationStore } from "store/conversationStore";
import { scrolleToIndexHelper } from "@lib/events";

interface IChatProps {
  reply?: IMessageReply;
  onClickReply?: (messageId: string) => void;
  noColorChange?: boolean;
  displayUsername?: boolean;
  canSelect?: boolean;
  self: boolean;
}

export interface IChat extends IChatProps {
  chat: IMessage;
  avatarVisibility?: "hidden" | "visible" | "none";
  style?: any;
  isSelected?: boolean;
}

function Chat({
  self,
  chat,
  avatarVisibility = "none",
  style,
  isSelected,
  ...chatProps
}: IChat & IChatProps): JSX.Element {
  const receiver = chat.user;
  const displayAvatar = avatarVisibility !== "none";
  const hideIndicators: IHideIndicators = self ? null : ["acknowledgment"];

  return (
    <div
      id="chat_message"
      style={style}
      className={classNames(
        {
          "cursor-pointer": chatProps.canSelect,
          "bg-black bg-opacity-20": isSelected,
        },
        `${self ? "ml-auto flex-row-reverse" : "mr-auto"} 
        group flex gap-3 text-xs px-4 pt-2 pb-2 `
      )}
    >
      <div
        className={`${self ? "ml-auto" : chat.from === "system" ? "mx-auto" : "mr-auto"} relative flex flex-col max-w-[calc(100%-(1rem+30px))]`}
      >
        <div
          className={`grid ${displayAvatar ? "grid-cols-[30px_1fr] gap-x-2" : ""} ${self ? "justify-items-end" : "justify-items-start"}`}
        >
          <RenderAvatar
            url={receiver?.profilePicture!}
            profileHidden={!receiver?.rules?.profilePicture.isVisible}
            avatarVisibility={avatarVisibility}
          />
          <RenderChat chat={chat} self={self} {...chatProps} />
          <ChatIndicators chat={chat} displayChatIndicators={chat.from !== "system"} hideIndicators={hideIndicators} />
        </div>
      </div>
    </div>
  );
}

export default memo(Chat);

function RenderChat({ chat, ...chatProps }: { chat: IMessage } & IChatProps) {
  const isEncrypted = Boolean(chat.message) && chat.from !== "system";
  const attachment = chat.attachment!;
  const messageString = isEncrypted ? decrypt(chat.message) : chat.message;
  const isEmoji = matchEmoji(messageString);
  const haveAttachment = !!chat.attachment;

  const { reply, displayUsername = false, noColorChange = false, self } = chatProps;

  const handleReply = () => {
    const id = reply?.messageId;
    scrolleToIndexHelper(id!);
  };

  const canShowAttachment = attachment && (attachment.type === "link" ? Boolean(attachment.metadata) : attachment.url);

  let messageClassNames = classnames(
      {
        hidden: !chat.message,
        "bg-primary text-white": !isEmoji && !haveAttachment && (self || noColorChange),
        "bg-base-300 shadow-lg text-base-content": !isEmoji && !haveAttachment && !self && !noColorChange,
      },
      `relative 
    text-sm 
    h-full 
    max-w-xl 
    text-base 
    rounded-2xl 
    overflow-hidden`
    ),
    messagePadding = classnames({
      "px-3": !isEmoji && !haveAttachment,
      "py-2": chat.message && haveAttachment,
      "py-1": chat.message && !haveAttachment,
    });
    
  return (
    <div
      className={classnames(`relative flex flex-col gap-1`, {
        "w-min": canShowAttachment,
      })}
    >
      <ImageAttachment attachment={attachment as IImageAttachment} />
      <div className={messageClassNames}>
        {chat.deleted ? (
          <DeletedMessage />
        ) : (
          <>
            <ReplyMessage reply={reply!} onClick={handleReply} />
            <UrlAttachment attachment={attachment as IUrlAttachment} />
            {chat.message && (
              <div className={messagePadding}>
                {displayUsername && <DisplaySenderName user={chat.user!} />}
                <RenderMessage text={messageString} isEmoji={isEmoji} />
              </div>
            )}
          </>
        )}
      </div>
      <ActionButtons
        classNames={`${self ? "-left-1 -translate-x-full" : "-right-1 translate-x-full flex-row-reverse"}`}
        disabled={chatProps.canSelect}
        chat={chat}
      />
    </div>
  );
}

function ActionButtons({
  chat,
  classNames,
  disabled = false,
}: {
  chat: IMessage;
  classNames?: string;
  disabled?: boolean;
}) {
  if (disabled) return null;

  const setMenu = useMenu((s) => s.setMenu);
  const setReplyRequest = useMessageStore((s) => s.setReplyRequest);

  function handleOpen(e: MouseEvent<HTMLDivElement>) {
    setMenu({ data: chat, reference: e, id: "chatarea" });
  }

  const handleReplyingChat = () => {
    const req = {
      messageId: chat.id,
      userId: chat.from!,
      message: chat.message,
      attachment: chat.attachment!,
    };

    setReplyRequest(req);
  };

  return (
    <div className={`max-sm:hidden flex items-center absolute top-0 bottom-0 ${classNames}`}>
      {!chat.deleted && (
        <div
          tabIndex={0}
          onClick={handleReplyingChat}
          className="group-hover:opacity-100 opacity-0 cursor-pointer btn btn-circle btn-ghost btn-xs"
        >
          <ArrowUturnLeftIcon className="size-4" />
        </div>
      )}
      <div className="group-hover:opacity-100 opacity-0 btn btn-circle btn-ghost btn-xs" onClick={handleOpen}>
        <EllipsisVerticalIcon className="size-5 pointer-events-none" />
      </div>
    </div>
  );
}

function DisplaySenderName({ user }: { user: IUser }) {
  const { setSelectedUser, profileTab } = useStore.getState();

  function handleOpenProfile() {
    setSelectedUser(user);
    profileTab.push("user");
  }

  return (
    <label onClick={handleOpenProfile} className="hover:underline hover:cursor-pointer  flex text-[11px] text-primary">
      {user.username}
    </label>
  );
}

function RenderAvatar({
  url,
  profileHidden,
  avatarVisibility,
}: {
  url: string;
  profileHidden: boolean;
  avatarVisibility: "hidden" | "visible" | "none";
}) {
  if (avatarVisibility === "none") return;

  return (
    <div className={`row-span-2 pt-1`}>
      {avatarVisibility === "visible" ? (
        <Avatar url={url} profileHidden={profileHidden} size="30px" onlineIndication={false} />
      ) : (
        <span />
      )}
    </div>
  );
}
