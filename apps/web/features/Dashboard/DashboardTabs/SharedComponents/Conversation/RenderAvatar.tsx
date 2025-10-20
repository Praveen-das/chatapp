"use client";
import React from "react";
import Avatar from "../../../../ui/Avatar";
import { IConversation } from "@repo/interfaces/conversationInterface";
import { IUser } from "@repo/interfaces/userInterface";

export function RenderAvatar({ conversation, receiver }: { conversation: IConversation; receiver?: IUser | null }) {
  if (conversation.host !== "user") {
    const profilePicture = conversation.host === "group" ? conversation.profilePicture : "/favicon.svg";
    return <Avatar url={profilePicture} onlineIndication={false} />;
  }

  if (!receiver) return <></>;

  const blockedConversation = conversation.blocked;

  const isOnline = receiver.status === "online";
 
  return (
    <Avatar
      url={receiver.profilePicture}
      profileHidden={Boolean(receiver.rules?.includes("hide_profilepicture"))}
      online={!blockedConversation && isOnline}
    />
  );
}
