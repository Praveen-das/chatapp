import AdminTag from "@features/ui/AdminTag";
import Avatar from "@features/ui/Avatar";
import { ChevronDownIcon } from "@heroicons/react/16/solid";
import { getUserFromMetadata } from "@lib/conversation";
import { IGroupMember } from "@repo/interfaces/conversationInterface";
import { IUser } from "@repo/interfaces/userInterface";
import { MouseEvent, useMemo } from "react";
import { useStore } from "store/global";
import { useMenu } from "store/menu";

export function Member({
  member: _member,
  isAdmin = false,
  showOptions = false,
}: {
  member: IGroupMember;
  isAdmin: boolean;
  showOptions?: boolean;
}) {
  const setSelectedUser = useStore((s) => s.setSelectedUser);
  const profileTab = useStore((s) => s.profileTab);
  const setMenu = useMenu((s) => s.setMenu);
  const menu = useMenu((s) => s.menu);
  const isOpen = menu?.id === "groupProfile" && menu?.data?.userId === _member.userId;
  const member = useMemo(() => getUserFromMetadata(_member)!, [_member]);

  function handleSelectedUser() {
    setSelectedUser(member);
    profileTab.push("user");
  }

  function handleDropdown(e: MouseEvent<HTMLDivElement>) {
    e.stopPropagation();
    setMenu({
      reference: { target: e.currentTarget },
      data: { ..._member, isAdmin },
      id: "groupProfile",
    });
  }

  return (
    <div
      key={member.id}
      className="group hover:bg-[--hover-secondary] duration-200  w-full flex items-center gap-4 max-sm:px-4 px-5 max-sm:py-2 py-3 cursor-pointer"
      onClick={handleSelectedUser}
    >
      <Avatar
        url={member.profilePicture}
        profileHidden={Boolean(member.rules?.includes("hide_profilepicture"))}
        size="40px"
        onlineIndication={false}
      />
      <div className="w-full flex flex-col justify-center">
        <div className="flex justify-between items-center w-full">
          <label className="py-1" htmlFor="member name">
            {member.username}
          </label>
          <AdminTag isAdmin={isAdmin} />
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
              className={`group-hover:opacity-100 btn btn-circle btn-xs btn-ghost outline-none duration-300 rounded-full text-current ${isOpen ? "opacity-100 scale-100" : "opacity-0 scale-90"}`}
            >
              <ChevronDownIcon className="size-5 pointer-events-none text-current opacity-60" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
