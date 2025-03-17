"use client";
import React, { MouseEvent } from "react";
import { useStore } from "../../../../../store/global";
import { parseUrl } from "@lib/utils";
import Link from "next/link";

export function RenderMessage({ text, isEmoji }: { text: string; isEmoji: boolean; }) {
  const parsedUrl = parseUrl(text);
  const isUrl = Boolean(parsedUrl);
  const samesite = isUrl && parsedUrl?.host === window.location.host;

  function handleOpeningModal(e: MouseEvent<HTMLAnchorElement>) {
    if (!samesite) return;
    e.preventDefault();

    const invitationId = parsedUrl.pathname.includes("/invite/") &&
      parsedUrl.pathname.split("/invite/")[1];

    if (!invitationId) return;

    useStore.getState().setModal({
      activeModal: "joinGroupModal",
      state: { invitationId },
      open: true,
    });
  }

  return (
    <>
      {isUrl ? (
        <Link
          onClick={handleOpeningModal}
          href={text}
          target={!samesite ? "_blank" : ""}
          className={`flex break-all relative link-hover z-3`}
        >
          {text}
        </Link>
      ) : (
        <p
          className={`whitespace-pre-wrap relative ${isEmoji ? "text-5xl" : ""} break-all z-3`}
        >
          {text}
        </p>
      )}
    </>
  );
}
