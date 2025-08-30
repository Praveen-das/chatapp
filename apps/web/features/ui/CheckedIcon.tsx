"use client";
import React from "react";
import { CheckIcon } from "@heroicons/react/16/solid";

export function CheckedIcon() {
  return (
    <span className="text-white bg-[--100-primary] rounded-full p-0.5">
      <CheckIcon className="size-4" />
    </span>
  );
}
