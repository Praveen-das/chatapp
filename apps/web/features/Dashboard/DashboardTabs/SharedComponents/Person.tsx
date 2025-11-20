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
      className={`group ${person.self && "border-2 border-white border-solid pointer-events-none"} flex gap-6 max-sm:px-0 px-4 items-center w-full max-sm:py-2 sm:min-h-[75px]  rounded-2xl cursor-pointer`}
    >
      <Avatar
        url={person.profilePicture}
        profileHidden={Boolean(person?.rules?.includes("hide_profilepicture"))}
        onlineIndication={false}
      />
      <div className="flex-1 space-y-1 w-full">
        <h1 className="text-sm">{person.self ? "yourself " + person.username : person.username}</h1>
        <h1 className="text-sm">{person.bio}</h1>
      </div>
      {isSelected ? <CheckedIcon /> : <span />}
    </div>
  );
}
