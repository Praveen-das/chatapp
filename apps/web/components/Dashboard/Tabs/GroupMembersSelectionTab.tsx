"use client";
import React, { Fragment, useMemo, useState } from "react";
import { useStore } from "../../../store/global";
import Person from "../Components/Person";
import { useTabs } from "./Tabs";
import SearchUser from "../Components/SearchUser";

const GroupMembersSelectionTab = () => {
  const setDashboardTab = useStore((s) => s.setDashboardTab);
  const setSelectedGroupMembers = useStore((s) => s.setSelectedGroupMembers);
  const selectedGroupMembers = useStore((s) => s.selectedGroupMembers);
  const users = useStore((s) => s.users);

  const [query, setQuery] = useState("");

  const queryResult = useMemo(() => {
    if (!query) return [];
    return users.filter((user) => user.username.includes(query));
  }, [query, users]);

  const handleSelectedUser = (id: string) => {
    setSelectedGroupMembers(id);
  };

  return (
    <>
      <SearchUser onChange={setQuery} />
      <div className="flex gap-2 justify-between items-center">
        <div className="flex gap-1 items-center text-xs w-full whitespace-nowrap overflow-scroll no-scrollbar">
          {selectedGroupMembers.map((id, idx) => (
            <label
              key={id}
              onClick={() => handleSelectedUser(id)}
              className="truncate min-w-36 bg-[--100-primary] text-white px-2 py-1 rounded-full cursor-pointer hover:line-through"
              htmlFor=""
            >
              {id}
            </label>
          ))}
        </div>
      </div>
      <div className="flex h-full w-full flex-col mt-4 gap-2 overflow-y-scroll no-scrollbar">
        {(query ? queryResult : users).map(
          (person) =>
            !person.self && (
              <Fragment key={person?.id}>
                <Person
                  onClick={() => handleSelectedUser(person.id)}
                  person={person}
                  isSelected={selectedGroupMembers.some(
                    (id) => id === person.id
                  )}
                />
              </Fragment>
            )
        )}
      </div>
      <div
        className={`${selectedGroupMembers.length === 0 ? "hidden" : "flex"} justify-center pb-4`}
      >
        <button
          onClick={() => setDashboardTab("createGroup")}
          className="btn btn-circle btn-md btn-primary text-white"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="size-7 "
          >
            <path
              fillRule="evenodd"
              d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </>
  );
};

export default GroupMembersSelectionTab;
