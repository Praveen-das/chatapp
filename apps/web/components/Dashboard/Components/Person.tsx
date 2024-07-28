"use client";
import React, { Fragment, useEffect, useState } from "react";
import { useStore } from "../../../store/global";
import { Avatar } from "./Avatar";

interface IPerson {
  person: IUser
  onClick?: any
  isSelected?: boolean
}

export default function Person({ person, onClick, isSelected }: IPerson): React.JSX.Element {
  const isOnline = person.status === 'online'

  return (
    <div onClick={onClick} className={`group ${person.self && 'border-2 border-white border-solid pointer-events-none'} flex gap-6 px-4 items-center w-full min-h-[75px]  rounded-2xl cursor-pointer`}>
      <Avatar
        profileHidden={!person?.rules?.profilePicture.isVisible}
        online={isOnline}
        // onlineIndication={false}
      />
      <div className="flex-1 space-y-1 w-full">
        <h1 className="text-sm">
          {person.self ? 'yourself ' + person.username : person.username}
        </h1>
        <h1 className="text-sm">{person.bio}</h1>
      </div>
      {
        isSelected ?
          <svg className="w-6 h-6 " xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
          </svg> : <span />
      }
    </div>
  );
}
