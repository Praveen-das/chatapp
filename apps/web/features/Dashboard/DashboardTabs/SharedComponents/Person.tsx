"use client";
import React, { Fragment, useEffect, useState } from "react";
import { useStore } from "../../../../store/global";
import Avatar from "../../../ui/Avatar";
import { IUser } from "@repo/interfaces/userInterface";
import { CheckedIcon } from "../../../ui/CheckedIcon";

interface IPerson {
  person: IUser;
  onClick?: any;
  isSelected?: boolean;
}

export default function Person({ person, onClick, isSelected }: IPerson): React.JSX.Element {
  return (
    <div
      onClick={onClick}
      className={`group ${
        person.self ? "border border-base-content/10 pointer-events-none bg-base-content/[0.02]" : "bg-transparent hover:bg-base-content/[0.03] active:scale-[0.98]"
      } flex gap-4 max-sm:px-0 px-4 items-center w-full max-sm:py-2 sm:min-h-[75px] rounded-2xl cursor-pointer transition-all duration-150 outline-none ${
        isSelected ? "bg-base-content/[0.06] shadow-[inset_0_0_0_1px_oklch(var(--bc)/0.05)]" : ""
      }`}
    >
      <Avatar
        url={person.profilePicture}
        profileHidden={Boolean(person?.rules?.includes("hide_profilepicture"))}
        onlineIndication={false}
      />
      <div className="flex-1 min-w-0 space-y-1">
        <h2 className="text-[14px] font-semibold text-base-content/90 truncate">
          {person.self ? `${person.username} (You)` : person.username}
        </h2>
        {person.bio && (
          <p className="text-xs text-base-content/50 truncate max-w-[90%]">
            {person.bio}
          </p>
        )}
      </div>
      {isSelected ? <CheckedIcon /> : <span />}
    </div>
  );
}
