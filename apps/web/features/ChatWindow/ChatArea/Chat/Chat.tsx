"use client";

import Avatar from "@features/ui/Avatar";
import { ArrowUturnLeftIcon, EllipsisVerticalIcon } from "@heroicons/react/24/solid";
import { IMessage } from "@interfaces/messageInterface";
import { getUserById } from "@lib/conversation";
import { matchEmoji } from "@lib/emojies";
import { scrolleToIndexHelper } from "@lib/events";
import { IImageAttachment, IMessageReply, IUrlAttachment } from "@repo/interfaces/messageInterface";
import { IUser } from "@repo/interfaces/userInterface";
import { default as classNames, default as classnames } from "classnames";
import { MouseEvent, memo } from "react";
import { useStore } from "store/global";
import { useMenu } from "store/menu";
import { useMessageStore } from "store/messageStore";
import ImageAttachment from "./Attachments/ImageAttachment";
import UrlAttachment from "./Attachments/UrlAttachment";
import ChatIndicators from "./ChatIndicators/ChatIndicators";
import { DeletedMessage } from "./Message/DeletedMessage";
import { RenderMessage } from "./Message/RenderMessage";
import { ReplyMessage } from "./Message/ReplyMessage";

interface IChatProps {
  reply?: IMessageReply;
  onClickReply?: (messageId: string) => void;
  noColorChange?: boolean;
  displayUsername?: boolean;
  canSelect?: boolean;
  replyButton?: boolean;
  self: boolean;
  mode?: "static" | "streaming";
}

export interface IChat extends IChatProps {
  chat: IMessage;
  avatarVisibility?: "hidden" | "visible" | "none";
  style?: any;
  isSelected?: boolean;
  readReceipt?: IMessage["readReceiptStatus"];
}

function Chat({
  self,
  chat,
  avatarVisibility = "none",
  style,
  isSelected,
  readReceipt,
  mode,
  ...chatProps
}: IChat & IChatProps): JSX.Element {
  const receiver = getUserById(chat.from!);
  const displayAvatar = avatarVisibility !== "none";
  const hideIndicators: IHideIndicators = self ? null : ["acknowledgment"];
  const isGenerating = chat.type === "generating";

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
        group flex gap-3 text-xs px-4 py-3 `,
      )}
    >
      <div
        className={`${self ? "ml-auto" : chat.type === "notification" ? "mx-auto" : "mr-auto"} relative flex flex-col max-w-[calc(100%-(1rem+30px))]`}
      >
        <div
          className={`grid ${displayAvatar ? "grid-cols-[30px_1fr] gap-x-2" : ""} ${self ? "justify-items-end" : "justify-items-start"}`}
        >
          <RenderAvatar
            url={receiver?.profilePicture!}
            profileHidden={receiver?.rules?.includes("hide_profilepicture")!}
            avatarVisibility={avatarVisibility}
          />
          {isGenerating ? (
            <RenderLoading />
          ) : (
            <>
              <RenderChat chat={chat} self={self} {...chatProps} />
              <ChatIndicators
                chat={chat}
                readReceipt={readReceipt}
                displayChatIndicators={chat.type !== "notification"}
                hideIndicators={hideIndicators}
                self={self}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(Chat);

function RenderLoading() {
  return (
    <div className="relative bg-[--base-300-100] shadow-lg rounded-2xl px-2">
      <span className="loading loading-dots loading-sm" />
    </div>
  );
}

function RenderChat({ chat, mode, ...chatProps }: { chat: IMessage } & IChatProps) {
  const attachment = chat.attachment!;
  const messageString = chat.message;

  const isEmoji = matchEmoji(messageString);
  const haveAttachment = !!chat.attachment;
  const receiver = getUserById(chat.from!);

  const { reply, displayUsername = false, noColorChange = false, self } = chatProps;

  const handleReply = () => {
    const id = reply?.messageId;
    scrolleToIndexHelper(id!);
  };

  const canShowAttachment = attachment && (attachment.type === "link" ? Boolean(attachment.metadata) : attachment.url);

  let messageClassNames = classnames(
      {
        hidden: !chat.message,
        "bg-primary text-white": !isEmoji && (self || noColorChange),
        "bg-[--base-300-100] shadow-lg text-base-content": !isEmoji && !self && !noColorChange,
      },
      `relative 
    text-sm 
    h-full 
    max-w-xl 
    text-base 
    rounded-2xl
    overflow-hidden`,
    ),
    messagePadding = classnames({
      "px-3": !isEmoji,
      "py-3": chat.message,
      // "py-1": chat.message && !haveAttachment,
    });

  return (
    <div
      className={classnames(`relative flex flex-col gap-1`, {
        "w-min": canShowAttachment,
      })}
    >
      <ImageAttachment
        attachment={attachment as IImageAttachment}
        isPlaceholder={Boolean(chat.type === "placeholder")}
      />

      <div className={messageClassNames}>
        {chat.deleted ? (
          <DeletedMessage />
        ) : (
          <>
            <ReplyMessage reply={reply!} onClick={handleReply} />
            <UrlAttachment attachment={attachment as IUrlAttachment} />
            {chat.message && (
              <div className={messagePadding}>
                {displayUsername && <DisplaySenderName user={receiver!} />}
                <RenderMessage mode={mode} id={chat.id} text={messageString} isEmoji={isEmoji} />
              </div>
            )}
          </>
        )}
      </div>
      <ActionButtons
        classNames={`${self ? "-left-1 -translate-x-full" : "-right-1 translate-x-full flex-row-reverse"}`}
        disabled={chatProps.canSelect}
        replyButton={Boolean(chatProps.replyButton)}
        chat={chat}
      />
    </div>
  );
}

function ActionButtons({
  chat,
  classNames,
  disabled = false,
  replyButton = true,
}: {
  chat: IMessage;
  classNames?: string;
  disabled?: boolean;
  replyButton?: boolean;
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
      {!chat.deleted && replyButton && (
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
      {user?.username}
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
