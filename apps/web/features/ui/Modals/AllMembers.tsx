import { useState, useMemo, MouseEvent, MouseEventHandler } from "react";
import useSocket from "../../../context/SocketProvider";
import useSelectedConversation from "../../../hooks/useSelectedConversation";
import { useConversationStore } from "../../../store/conversationStore";
import Avatar from "../Avatar";
import SearchUser from "../Searchbar";
import AdminTag from "../AdminTag";
import { useStore } from "../../../store/global";
import { IUser } from "@repo/interfaces/userInterface";
import { IGroupConversation, IGroupMember } from "@repo/interfaces/conversationInterface";
import Menu from "@features/ui/Menu";
import { useMenu } from "store/menu";
import useAuth from "@hooks/useAuth";
import { XCircleIcon } from "@heroicons/react/24/solid";
import ModalTitle from "./components/ModalTitle";
import FramerWrapper from "../MotionWrapper";
import { getUserById, getUserFromMetadata } from "@lib/conversation";

export const AllMembers = () => {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const setMenu = useMenu((s) => s.setMenu);

  const setSelectedUser = useStore((s) => s.setSelectedUser);
  const { setSelectedConversation } = useConversationStore((s) => s.conversationActions);
  const profileTab = useStore((s) => s.profileTab);
  const toggleProfile = useStore((s) => s.toggleProfile);
  const { removeMemberFromGroup, makeAdmin, removeFromAdmin } = useSocket();
  const setModal = useStore((s) => s.setModal);
  const selectedConversation = useSelectedConversation<IGroupConversation>();

  if (!selectedConversation) return;

  const members = useMemo(() => selectedConversation?.members, [selectedConversation]);
  const userIsAdmin = selectedConversation.admins.includes(user?.id!);

  const _members = useMemo(() => {
    const ordered = members.reduce((i, meta) => {
      let member = getUserFromMetadata(meta);

      if (!member) return i;

      let char = member.username?.slice(0, 1)!;
      let values = i.get(char);

      if (values) {
        values.push(meta);
        values.sort((a, b) => {
          const usernameA = (getUserFromMetadata(a)?.username ?? "").toLowerCase();
          const usernameB = (getUserFromMetadata(b)?.username ?? "").toLowerCase();
          return usernameA.localeCompare(usernameB);
        });
      } else i.set(char, [meta]);

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
    return members.filter((member) => getUserFromMetadata(member)?.username.includes(query));
  }, [query, members]);

  const handleSelectingUser = (member: IGroupMember) => {
    setSelectedUser(getUserFromMetadata(member)!);
    profileTab.push("user");
    setModal(false);
  };

  const handleMessagingUser = (member: IGroupMember) => {
    setSelectedUser(getUserFromMetadata(member)!);
    setSelectedConversation(null);
    toggleProfile(false);

    setModal(false);
  };

  function handleRemovingMember(member: IGroupMember) {
    if (!selectedConversation) return;
    if (!member) return;

    removeMemberFromGroup(selectedConversation, member);
  }

  function handleAdmin(userId: string, action: string) {
    if (action === "add") makeAdmin(selectedConversation!, userId);
    else removeFromAdmin(selectedConversation!, userId);
  }

  const handleSelecting = (event: MouseEvent<HTMLDivElement>, member: IGroupMember) => {
    event.stopPropagation();
    setMenu({ id: "ALL_MEMBERS", data: member, reference: event });
  };

  return (
    <div
      id="container"
      className={`modal-box max-sm:max-w-full max-sm:max-h-full max-sm:rounded-none max-sm:pt-4 max-sm:w-full max-sm:h-full relative flex flex-col max-w-[450px] h-full m-auto  px-0 pb-0 z-0 overflow-hidden !transform-none bg-transparent`}
    >
      <div className="absolute inset-0 backdrop-blur-xl bg-[--modal] z-[-1]"></div>
      <ModalTitle>Group members</ModalTitle>
      <div className="max-sm:px-4 px-6 mt-4">
        <SearchUser query={query} onChange={setQuery} highlightElm=".displayName" highlightResults />
      </div>
      <div className="flex relative flex-col w-full h-full overflow-y-scroll no-scrollbar mt-4 mb-2 px-3">
        <Menu<IGroupMember> id="ALL_MEMBERS" clientPoint>
          {(member) => (
            <>
              <Menu.Item onClick={() => handleSelectingUser(member)}>View Profile</Menu.Item>
              <Menu.Item onClick={() => handleMessagingUser(member)}>Message</Menu.Item>
              {userIsAdmin && (
                <>
                  <Menu.Item onClick={() => handleAdmin(member?.userId!, member.isAdmin ? "remove" : "add")}>
                    {member?.isAdmin ? "Remove Admin" : "Make Admin"}
                  </Menu.Item>
                  <Menu.Item onClick={() => handleRemovingMember(member)}>Remove</Menu.Item>
                </>
              )}
            </>
          )}
        </Menu>

        {query
          ? queryResult.map((member) => <Member member={member} onClick={(e) => handleSelecting(e, member)} />)
          : _members.map(([key, groupMembers]) => (
              <div key={key}>
                <div className="w-full flex gap-2 items-end max-sm:px-4 px-6 py-2 my-2">
                  <label className="text-sm px-2 py-[2px] bg-primary text-white rounded-lg" htmlFor="">
                    {key}
                  </label>
                  <span className="w-full h-[2px] bg-black/10" />
                </div>
                {groupMembers.map((member) => (
                  <Member key={member.userId} member={member} onClick={(e) => handleSelecting(e, member)} />
                ))}
              </div>
            ))}
      </div>
    </div>
  );
};

function Member({ member, onClick }: { member: IGroupMember; onClick: (e: MouseEvent<HTMLDivElement>) => void }) {
  if (!member) return null;
  const { profilePicture, username, phoneNumber } = getUserFromMetadata(member)!;
  return (
    <div className="hover:bg-[--hover-secondary] rounded-2xl" onClick={onClick} key={member.userId}>
      <div className="relative max-sm:px-4 px-5 flex items-center gap-4 w-full h-16 z-20 pointer-events-none">
        <Avatar url={profilePicture} onlineIndication={false} />
        <div className="w-full flex gap-1 flex-col justify-between">
          <div className="flex justify-between items-center">
            <label className="text-sm " htmlFor="">
              {username}
            </label>
            <AdminTag isAdmin={Boolean(member.isAdmin)} />
          </div>
          <div className="flex justify-between items-center opacity-60">
            <label className="text-xs text-end" htmlFor="">
              {phoneNumber}
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
