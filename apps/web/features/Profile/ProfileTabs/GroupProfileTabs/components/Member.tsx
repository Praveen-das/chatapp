import AdminTag from "@features/ui/AdminTag";
import Avatar from "@features/ui/Avatar";
import { ChevronDownIcon } from "@heroicons/react/16/solid";
import { IGroupMember } from "@repo/interfaces/conversationInterface";
import { IUser } from "@repo/interfaces/userInterface";
import { MouseEvent } from "react";
import { useStore } from "store/global";
import { useMenu } from "store/menu";

export function Member({ member, showOptions = false }: { member: IGroupMember; showOptions?: boolean }) {
  const setSelectedUser = useStore((s) => s.setSelectedUser);
  const profileTab = useStore((s) => s.profileTab);
  const setMenu = useMenu((s) => s.setMenu);

  function handleSelectedUser() {
    setSelectedUser(member as IUser);
    profileTab.push("user");
  }

  function handleDropdown(e: MouseEvent<HTMLDivElement>) {
    e.stopPropagation();
    setMenu({
      reference: e,
      data: member,
      id: "groupProfile",
    });
  }

  return (
    <div
      key={member.id}
      className="group hover:bg-[--hover-secondary] duration-200  w-full flex items-center gap-4 max-sm:px-4 px-8 max-sm:py-2 py-3 cursor-pointer"
      onClick={handleSelectedUser}
    >
      <Avatar
        url={member.profilePicture}
        profileHidden={!member.rules?.profilePicture.isVisible}
        size="40px"
        onlineIndication={false}
      />
      <div className="w-full flex flex-col justify-center">
        <div className="flex justify-between items-center w-full">
          <label className="py-1" htmlFor="member name">
            {member.username}
          </label>
          <AdminTag isAdmin={member.isAdmin} />
        </div>
        <div className="flex justify-between items-center">
          {member.phoneNumber ? (
            <label className="text-xs text-base-content/50" htmlFor="">
              +{member.phoneNumber}
            </label>
          ) : (
            <span />
          )}
          {showOptions && (
            <span
              onClick={handleDropdown}
              tabIndex={0}
              className="group-hover:opacity-100 btn btn-circle btn-xs btn-ghost outline-none duration-300 rounded-full opacity-0 "
            >
              <ChevronDownIcon className="size-5 pointer-events-none" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
