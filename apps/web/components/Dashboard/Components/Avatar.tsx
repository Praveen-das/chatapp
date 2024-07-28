"use client";
import React from "react";

interface IAvatar {
  online?: boolean,
  onlineIndication?: boolean,
  size?: string
  profileHidden?: boolean
}

export function Avatar({ online = false, onlineIndication = true, size = '40px', profileHidden = false }: IAvatar) {
  return (
    <div className={`self-center relative ${profileHidden ? 'bg-red-500' : 'bg-gray-500'} rounded-full`} style={{ minWidth: size, width: size, height: size }}>
      {
        onlineIndication &&
        <span className={`absolute top-0 right-0 w-3 h-3 ${online ? "bg-green-400" : "bg-gray-400"} rounded-full`} />
      }
    </div>
  );
}
