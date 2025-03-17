"use client";
import React from "react";
import moment from "moment";


export function Timestamp({ timeInMs }: { timeInMs: number; }) {
  return <label htmlFor="">{moment(new Date(timeInMs)).format("LT")}</label>;
}
