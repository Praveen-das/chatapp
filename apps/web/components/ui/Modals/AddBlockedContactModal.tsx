import { useMemo, useState } from "react";
import useSocket from "../../../context/SocketProvider";
import useAuth from "../../../hooks/useAuth";
import { useStore } from "../../../store/global";
import SearchUser from "../Searchbar";
import { User } from "./components/User";
import { IUser } from "../../../interfaces/userInterface";
import { useConversationStore } from "store/conversationStore";
import { IUserConversation } from "@interfaces/conversationInterface";
import { generateConversation } from "@lib/conversation";

export const AddBlockedContactModal = () => {
  const { user } = useAuth();
  const userList = useStore((s) => s.users);
  const setModal = useStore((s) => s.setModal);
  const { sendUserBlockRequest } = useSocket();
  const conversations = useConversationStore((s) => s.conversations);

  const [query, setQuery] = useState("");

  const users = useMemo(
    () =>
      userList.filter(
        (u) =>
          u.id !== user?.id &&
          !conversations.some(
            (c) =>
              c.host === "user" &&
              c.blocked &&
              c.members.some((m) => m.id === u.id)
          )
      ),
    [userList]
  );

  const queryResult = useMemo(() => {
    if (!query) return [];
    return users.filter((user) => user.username.includes(query));
  }, [query, users]);

  const handleSelectedUsers = (selectedUsers: IUser) => {
    const conversation = conversations.find(
      (c) =>
        c.host === "user" && c.members.some((m) => m.id === selectedUsers.id)
    ) as IUserConversation;

    if (!conversation) {
      const newConversation = generateConversation(user!, selectedUsers);
      sendUserBlockRequest(newConversation!,true);
    }else{
      sendUserBlockRequest(conversation!);
    }

    setModal(null);
  };

  return (
    <div className="modal-box max-sm:max-w-full max-sm:max-h-full max-sm:rounded-none max-sm:pt-4 max-sm:w-full max-sm:h-full h-full px-0 pb-0 relative flex flex-col sm:max-w-[450px] bg-[--modal]">
      <div className="flex max-sm:px-4 px-6 justify-between items-center w-full ">
        <h3 className="font-medium text-lg">Select Contact</h3>
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
        <SearchUser onChange={setQuery} />
      </div>
      <div className="w-full h-full space-y-2 overflow-y-scroll no-scrollbar mt-4 mb-2">
        {(query ? queryResult : users).map(
          (person) =>
            person.id !== user?.id && (
              <div key={person.id} onClick={() => handleSelectedUsers(person)}>
                <User selectable={false} person={person} />
              </div>
            )
        )}
      </div>
    </div>
  );
};
