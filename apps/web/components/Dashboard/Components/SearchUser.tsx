"use client";
import React, { ChangeEvent, useEffect, useState } from "react";

interface ISearch {
  onChange: (value: string) => void
  highlightResults?: boolean
  highlightElm?: string
}

export default function SearchUser({ onChange, highlightElm, highlightResults = false }: ISearch) {
  const [value, setValue] = useState('')

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value)
    onChange(e.target.value)
  }

  useEffect(() => {
    if (!highlightResults) return
    if (!highlightElm) return

    document.querySelectorAll<any>(highlightElm)
      .forEach(elm => {
        let regex = new RegExp(value, "gi");

        const text = elm.innerText;

        const highlightedText = text.replace(regex, (matched: string) => "<span class='bg-primary'>" + matched + "</span>")

        elm.innerHTML = highlightedText;
      })
      
  }, [value, highlightResults, highlightElm])

  return (
    <div className="flex gap-2 rounded-2xl px-3 py-2 bg-base-200 shadow-lg">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
      </svg>
      <input value={value} onChange={handleChange} className="w-full h-full bg-transparent  outline-none" type="text" />
    </div>
  )
}
