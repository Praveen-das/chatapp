"use client";
import React, { Fragment, useEffect, useState } from "react";
import { useStore } from "../../../store/global";
import Avatar from "../../ui/Avatar";
import { IUser } from "../../../interfaces/userInterface";

interface IPerson {
  person: IUser;
  onClick?: any;
  isSelected?: boolean;
}

export default function Person({
  person,
  onClick,
  isSelected,
}: IPerson): React.JSX.Element {
  const isOnline = person.status === "online";

  return (
    <div
      onClick={onClick}
      className={`group ${person.self && "border-2 border-white border-solid pointer-events-none"} flex gap-6 max-sm:px-0 px-4 items-center w-full max-sm:py-2 sm:min-h-[75px]  rounded-2xl cursor-pointer`}
    >
      <Avatar
        url={person.profilePicture}
        profileHidden={!person?.rules?.profilePicture.isVisible}
        online={isOnline}
        // onlineIndication={false}
      />
      <div className="flex-1 space-y-1 w-full">
        <h1 className="text-sm">
          {person.self ? "yourself " + person.username : person.username}
        </h1>
        <h1 className="text-sm">{person.bio}</h1>
      </div>
      {isSelected ? (
        <span className="text-white bg-[--100-primary] rounded-full p-0.5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="size-4"
          >
            <path
              fillRule="evenodd"
              d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      ) : (
        <span />
      )}
    </div>
  );
}
