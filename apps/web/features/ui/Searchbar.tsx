"use client";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/solid";
import React, { ChangeEvent, useEffect, useState } from "react";

interface ISearch {
  initialValue?: string;
  onChange?: (value: string) => void;
  onClick?: () => void;
  highlightResults?: boolean;
  highlightElm?: string;
  query: string;
  placeholder?: string;
}

export default function Searchbar({
  onChange = () => {},
  query,
  onClick,
  highlightElm,
  highlightResults = false,
  placeholder = "Search...",
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
      className={`flex items-center ${
        onClick ? "flex-row-reverse" : ""
      } gap-2 rounded-2xl px-3.5 py-2 bg-[var(--base-200-300)] dark:bg-base-content/[0.03] backdrop-blur-md transition-all duration-200 hover:border-base-content/20 dark:hover:border-base-content/10 dark:focus-within:bg-base-100/30 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-zinc-400 dark:focus-within:ring-white/20 focus-within:shadow-[0_4px_16px_rgba(0,0,0,0.04)]`}
    >
      <div className="btn btn-circle btn-xs btn-ghost pointer-events-none text-base-content/40 w-6 h-6 min-h-6 p-0 shadow-none border-none flex justify-center items-center">
        <MagnifyingGlassIcon className="size-4 text-base-content/50" />
      </div>
      <input
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full h-full bg-transparent outline-none text-[13.5px] font-normal text-base-content placeholder:text-base-content/40"
        type="text"
      />
      {query && (
        <button
          onClick={() => onChange("")}
          className="btn btn-circle btn-ghost btn-xs w-5 h-5 min-h-5 p-0 flex justify-center items-center text-base-content/40 hover:text-base-content/80 hover:bg-base-content/10 active:scale-[0.9] transition-all duration-150 border-none shadow-none"
          type="button"
        >
          <XMarkIcon className="size-3.5" />
        </button>
      )}
    </div>
  );
}
