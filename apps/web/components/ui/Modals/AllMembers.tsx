import { useState, useMemo, MouseEvent, MouseEventHandler } from "react";
import useSocket from "../../../context/SocketProvider";
import useSelectedConversation from "../../../hooks/useSelectedConversation";
import { useConversationStore } from "../../../store/conversationStore";
import Avatar from "../Avatar";
import SearchUser from "../Searchbar";
import AdminTag from "../AdminTag";
import { useStore } from "../../../store/global";
import { IUser } from "../../../interfaces/userInterface";
import {
  IGroupConversation,
  IGroupMember,
} from "../../../interfaces/conversationInterface";
import Menu from "@components/ui/Menu";
import { useMenu } from "store/menu";
import useAuth from "@hooks/useAuth";

export const AllMembers = () => {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [reference, setReference] = useState<HTMLDivElement | null>(null);
  const menu = useMenu((s) => s.menu);
  const setMenu = useMenu((s) => s.setMenu);

  const setSelectedUser = useStore((s) => s.setSelectedUser);
  const setSelectedConversation = useConversationStore(
    (s) => s.setSelectedConversation
  );
  const setProfileTab = useStore((s) => s.setProfileTab);
  const toggleProfile = useStore((s) => s.toggleProfile);
  const { removeMemberFromGroup, makeAdmin, removeFromAdmin } = useSocket();
  const setModal = useStore((s) => s.setModal);

  const selectedConversation = useSelectedConversation() as IGroupConversation;
  const members = selectedConversation?.members;
  const userIsAdmin = selectedConversation.admins.includes(user?.id!);

  const _members = useMemo(() => {
    const ordered = members.reduce((i, c) => {
      let char = c.username?.slice(5, 6)!;
      let values = i.get(char);

      if (values) {
        values.push(c);
        values.sort((a, b) => a.username!.localeCompare(b.username!));
      } else i.set(char, [c]);

      return i;
    }, new Map<string, IGroupMember[]>());

    return Array.from(ordered).sort((a, b) => {
      if (a[0] < b[0]) return -1;
      if (a[0] > b[0]) return 1;
      return 0;
    });
  }, [members]);

  const queryResult = useMemo(() => {
    if (!query) return [];
    return members.filter((member) => member.username.includes(query));
  }, [query, members]);

  const handleSelectingUser = (member: IGroupMember) => {
    setSelectedUser(member as IUser);
    setProfileTab("user");

    setModal(null);
  };

  const handleMessagingUser = (member: IGroupMember) => {
    setSelectedUser(member as IUser);
    setSelectedConversation(null);
    toggleProfile(false);

    setModal(null);
  };

  function handleRemovingMember(member: IGroupMember) {
    removeMemberFromGroup(selectedConversation, member);
  }

  function handleAdmin(userId: string, action: string) {
    if (action === "add")
      makeAdmin(selectedConversation.conversationId, userId);
    else removeFromAdmin(selectedConversation.conversationId, userId);
  }

  const options = useMemo(() => {
    return [
      {
        label: "View Profile",
        handler: handleSelectingUser,
      },
      {
        label: "Message",
        handler: handleMessagingUser,
      },
      {
        label: "admin",
        handler: () => null,
      },
      {
        label: "Remove",
        handler: handleRemovingMember,
      },
    ];
  }, []);

  const handleSelecting = (
    event: MouseEvent<HTMLDivElement>,
    member: IGroupMember
  ) => {
    const elm = reference?.getBoundingClientRect()!;
    if (!elm) return;

    const x = event.clientX - elm.x;
    const y = event.clientY - elm.y;

    setMenu({ id: "ALL_MEMBERS", position: { x, y }, data: member, reference });
  };

  return (
    <div
      id="container"
      className="modal-box max-sm:max-w-full max-sm:max-h-full max-sm:rounded-none max-sm:pt-4 max-sm:w-full max-sm:h-full relative flex flex-col max-w-[450px] h-full m-auto  px-0 pb-0 bg-[--modal] z-0 overflow-hidden"
    >
      <div className="flex max-sm:px-4 px-6 justify-between items-center w-full ">
        <h3 className="font-medium text-lg">Group members</h3>
        <form method="dialog">
          <button className="btn btn-circle btn-sm btn-ghost">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6"
            >
              <path
                fillRule="evenodd"
                d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </form>
      </div>
      <div className="max-sm:px-4 px-6 mt-4">
        <SearchUser
          onChange={setQuery}
          highlightElm=".displayName"
          highlightResults
        />
      </div>
      <div className="flex relative flex-col w-full h-full space-y-4 overflow-y-scroll no-scrollbar mt-4 mb-2">
        <div
          ref={setReference}
          className="absolute z-50"
          style={{ top: menu?.position?.y, left: menu?.position?.x }}
        >
          <Menu<IGroupMember> id="ALL_MEMBERS">
            {(member) => (
              <>
                <Menu.Item onClick={() => handleSelectingUser(member)}>
                  View Profile
                </Menu.Item>
                <Menu.Item onClick={() => handleMessagingUser(member)}>
                  Message
                </Menu.Item>
                {userIsAdmin && (
                  <>
                    <Menu.Item
                      onClick={() =>
                        handleAdmin(
                          member?.id!,
                          member.isAdmin ? "remove" : "add"
                        )
                      }
                    >
                      {member?.isAdmin ? "Remove Admin" : "Make Admin"}
                    </Menu.Item>
                    <Menu.Item onClick={() => handleRemovingMember(member)}>
                      Remove
                    </Menu.Item>
                  </>
                )}
              </>
            )}
          </Menu>
        </div>

        {query
          ? queryResult.map((member) => (
              <Member
                member={member}
                onClick={(e) => handleSelecting(e, member)}
              />
            ))
          : _members.map(([key, groupMembers]) => (
              <div key={key}>
                <div className="w-full flex gap-2 items-end max-sm:px-4 px-6 my-2">
                  <label
                    className="text-sm px-2 py-[2px] bg-primary text-white rounded-lg"
                    htmlFor=""
                  >
                    {key}
                  </label>
                  <span className="w-full h-[2px] bg-black/30" />
                </div>
                {groupMembers.map((member) => (
                  <Member
                    key={member.id}
                    member={member}
                    onClick={(e) => handleSelecting(e, member)}
                  />
                ))}
              </div>
            ))}
      </div>
    </div>
    // <div className="fixed flex inset-0">
    // </div>
  );
};

function Member({
  member,
  onClick,
}: {
  member: IGroupMember;
  onClick: (e: MouseEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      onClick={onClick}
      key={member.id}
      className="relative max-sm:px-4 px-10 flex items-center hover:bg-[--hover-secondary] gap-4 w-full h-16 py-2 z-20"
    >
      <Avatar url={member.profilePicture} onlineIndication={false} />
      <div className="w-full flex gap-1 flex-col justify-between">
        <div className="flex justify-between items-center">
          <label className="text-sm " htmlFor="">
            {member.username}
          </label>
          <AdminTag isAdmin={member.isAdmin} />
        </div>
        <div className="flex justify-between items-center opacity-60">
          <label className="text-sm max-w-1/3 truncate" htmlFor="">
            {member.bio || "asd asdasd qwe zx"}
          </label>
          <label className="text-xs text-end" htmlFor="">
            +918848990353
          </label>
        </div>
      </div>
    </div>
  );
}
