import { useMemo, useState } from "react";
import useSocket from "../../../context/SocketProvider";
import useAuth from "../../../hooks/useAuth";
import { useStore } from "../../../store/global";
import SearchUser from "../Searchbar";
import { User } from "./components/User";
import { IUser } from "@repo/interfaces/userInterface";
import { useConversationStore } from "store/conversationStore";
import { IUserConversation } from "@repo/interfaces/conversationInterface";
import { generateConversation, generateUserConversations, handleGeneratingConversation } from "@repo/utils/index";
import { XCircleIcon } from "@heroicons/react/24/solid";
import ModalTitle from "./components/ModalTitle";
import FramerWrapper from "../MotionWrapper";

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
          !conversations.some((c) => c.host === "user" && c.blocked && c.members.some((m) => m.id === u.id))
      ),
    [userList]
  );

  const queryResult = useMemo(() => {
    if (!query) return [];
    return users.filter((user) => user.username.includes(query));
  }, [query, users]);

  const handleSelectedUsers = (selectedUser: IUser) => {
    const userConversation = conversations.find(
      (c) => c.host === "user" && c.members.some((m) => m.id === selectedUser.id)
    ) as IUserConversation;

    if (!userConversation) {
      const {conversation,userConversations} = handleGeneratingConversation(user!, selectedUser);
      sendUserBlockRequest({ conversation, userConversations });
    } else {
      sendUserBlockRequest({ userConversation });
    }

    setModal(false);
  };

  return (
    <FramerWrapper
      className={`modal-box max-sm:max-w-full max-sm:max-h-full max-sm:rounded-none max-sm:pt-4 max-sm:w-full max-sm:h-full h-full px-0 pb-0 relative flex flex-col sm:max-w-[450px] bg-[--modal]`}
    >
      {/* <div className="flex  justify-between items-center w-full ">
      </div> */}
      <ModalTitle>Select Contact</ModalTitle>
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
    </FramerWrapper>
  );
};
