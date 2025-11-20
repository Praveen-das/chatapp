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
import { getActiveUsers } from "@lib/conversation";
import { useUnblockedUsers } from "@hooks/useUsers";

export const AddBlockedContactModal = () => {
  const { user } = useAuth();
  const setModal = useStore((s) => s.setModal);
  const { sendUserBlockRequest, sendRequestToRegisterConversation } = useSocket();
  const conversations = useConversationStore((s) => s.conversations);
  const unblockedUsers = useUnblockedUsers();

  const [query, setQuery] = useState("");

  const queryResult = useMemo(() => {
    if (!query) return [];
    return unblockedUsers.filter((unblockedUser) => unblockedUser.username.includes(query));
  }, [query, unblockedUsers]);

  const handleSelectedUsers = (selectedUser: IUser) => {
    const userConversation = conversations.find(
      (c) => c.host === "user" && c.members.some((m) => m.userId === selectedUser.id)
    ) as IUserConversation;

    if (!userConversation) {
      sendRequestToRegisterConversation(
        { currentUser: user!, participant: selectedUser },
        {
          blocked: [user?.id!],
        }
      );
    } else {
      sendUserBlockRequest(userConversation);
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
        <SearchUser query={query} onChange={setQuery} />
      </div>
      <div className="w-full h-full space-y-2 overflow-y-scroll no-scrollbar mt-4 mb-2">
        {(query ? queryResult : unblockedUsers).map(
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
