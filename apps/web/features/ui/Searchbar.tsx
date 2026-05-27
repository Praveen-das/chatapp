"use client";
import { MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import React, { ChangeEvent, useEffect, useState } from "react";

interface ISearch {
  initialValue?: string;
  onChange?: (value: string) => void;
  onClick?: () => void;
  highlightResults?: boolean;
  highlightElm?: string;
  query: string;
}

export default function Searchbar({
  onChange = () => {},
  query,
  onClick,
  highlightElm,
  highlightResults = false,
}: ISearch) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  useEffect(() => {
    if (!highlightResults) return;
    if (!highlightElm) return;

    document.querySelectorAll<any>(highlightElm).forEach((elm) => {
      let regex = new RegExp(query, "gi");

      const text = elm.innerText;

      const highlightedText = text.replace(
        regex,
        (matched: string) => "<span class='bg-primary'>" + matched + "</span>",
      );

      elm.innerHTML = highlightedText;
    });
  }, [query, highlightResults, highlightElm]);

  useEffect(() => {
    if (onClick) {
      window.onkeydown = (e) => {
        if (e.key === "Enter") onClick();
      };
    }
  }, [onClick]);

  return (
    <div
      className={`flex items-center ${onClick ? "flex-row-reverse" : ""} gap-2 rounded-2xl px-3 py-2 bg-[--base-100-300] shadow-lg`}
    >
      <div className={`btn btn-circle btn-xs btn-ghost `}>
        <MagnifyingGlassIcon />
      </div>
      <input value={query} onChange={handleChange} className="w-full h-full bg-transparent  outline-none" type="text" />
    </div>
  );
}
