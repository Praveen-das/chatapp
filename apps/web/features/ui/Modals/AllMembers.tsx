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
  const conversationId = useConversationStore((s) => s.selectedConversation)?.id;
  const selectedConversation = useSelectedConversation<IGroupConversation>(conversationId!);

  if (!selectedConversation) return;

  const members = selectedConversation?.members;
  const userIsAdmin = selectedConversation.admins.includes(user?.id!);

  const _members = useMemo(() => {
    const ordered = members.reduce((i, c) => {
      let char = c.username?.slice(0, 1)!;
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
    profileTab.push("user");
    setModal(false);
  };

  const handleMessagingUser = (member: IGroupMember) => {
    setSelectedUser(member as IUser);
    setSelectedConversation(null);
    toggleProfile(false);

    setModal(false);
  };

  function handleRemovingMember(member: IGroupMember) {
    removeMemberFromGroup(selectedConversation!, member);
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
        <SearchUser onChange={setQuery} highlightElm=".displayName" highlightResults />
      </div>
      <div className="flex relative flex-col w-full h-full overflow-y-scroll no-scrollbar mt-4 mb-2">
        <Menu<IGroupMember> id="ALL_MEMBERS" clientPoint>
          {(member) => (
            <>
              <Menu.Item onClick={() => handleSelectingUser(member)}>View Profile</Menu.Item>
              <Menu.Item onClick={() => handleMessagingUser(member)}>Message</Menu.Item>
              {userIsAdmin && (
                <>
                  <Menu.Item onClick={() => handleAdmin(member?.id!, member.isAdmin ? "remove" : "add")}>
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
                <div className="w-full flex gap-2 items-end max-sm:px-4 px-6 my-2">
                  <label className="text-sm px-2 py-[2px] bg-primary text-white rounded-lg" htmlFor="">
                    {key}
                  </label>
                  <span className="w-full h-[2px] bg-black/10" />
                </div>
                {groupMembers.map((member) => (
                  <Member key={member.id} member={member} onClick={(e) => handleSelecting(e, member)} />
                ))}
              </div>
            ))}
      </div>
    </div>
  );
};

function Member({ member, onClick }: { member: IGroupMember; onClick: (e: MouseEvent<HTMLDivElement>) => void }) {
  return (
    <div className="hover:bg-[--hover-secondary]" onClick={onClick} key={member.id}>
      <div className="relative max-sm:px-4 px-10 flex items-center gap-4 w-full h-16 py-2 z-20 pointer-events-none">
        <Avatar url={member.profilePicture} onlineIndication={false} />
        <div className="w-full flex gap-1 flex-col justify-between">
          <div className="flex justify-between items-center">
            <label className="text-sm " htmlFor="">
              {member.username}
            </label>
            <AdminTag isAdmin={member.isAdmin} />
          </div>
          <div className="flex justify-between items-center opacity-60">
            <label className="text-xs text-end" htmlFor="">
              {member.phoneNumber}
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
