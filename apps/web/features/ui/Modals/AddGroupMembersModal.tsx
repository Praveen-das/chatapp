import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import useSocket from "../../../context/SocketProvider";
import useAuth from "../../../hooks/useAuth";
import { useConversationStore } from "../../../store/conversationStore";
import SearchUser from "../Searchbar";
import { useStore } from "../../../store/global";
import { User } from "./components/User";
import useSelectedConversation from "../../../hooks/useSelectedConversation";
import { IGroupConversation } from "../../../interfaces/conversationInterface";
import { IUser } from "@interfaces/userInterface";
import { XCircleIcon } from "@heroicons/react/24/solid";

export const AddGroupMembersModal = () => {
  const setModal = useStore((s) => s.setModal);
  const { addMembersToGroup } = useSocket();

  const { user } = useAuth();
  const conversationId = useConversationStore((s) => s.selectedConversation)?.id;

  if (!conversationId) return null;

  const selectedConversation = useSelectedConversation<IGroupConversation>(conversationId);
  const members = selectedConversation.members;
  const users = useStore((s) => s.users).filter((u) => u.id !== user?.id && !members?.find((m) => m.id === u.id));
  const [selectedUsers, setSelectedUsers] = useState<IUser[]>([]);
  const [query, setQuery] = useState("");

  const queryResult = useMemo(() => {
    if (!query) return [];
    return users.filter((user) => user.username.includes(query));
  }, [query, users]);

  const handleSelectedUser = (selectedUser: IUser) => {
    setSelectedUsers((s) => {
      let selected = s.includes(selectedUser);
      if (selected) return s.filter((u) => u !== selectedUser);
      return [selectedUser, ...s];
    });
  };

  function onSubmit() {
    addMembersToGroup(selectedConversation as IGroupConversation, selectedUsers);
    setModal(null);
  }

  const container = {
    hidden: { scale: 0 },
    visible: {
      scale: 1,
      transition: {
        delayChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { y: 50, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { delay: 0.1 } },
  };

  return (
    <div className="modal-box max-sm:max-w-full max-sm:max-h-full max-sm:rounded-none max-sm:pt-4 max-sm:w-full max-sm:h-full h-full px-0 pb-0 relative flex flex-col max-w-[450px] bg-[--modal]">
      <div className="flex max-sm:px-4 px-6 justify-between items-center w-full ">
        <h3 className="font-medium text-lg">Select Contact</h3>
        <form method="dialog">
          <button className="btn btn-circle btn-sm btn-ghost">
            <XCircleIcon className="size-6" />
          </button>
        </form>
      </div>
      <div className="max-sm:px-4 px-6 mt-4">
        <SearchUser onChange={setQuery} />
      </div>
      <div className="w-full h-full space-y-2 overflow-y-scroll no-scrollbar mt-4 mb-2">
        {(query ? queryResult : users).map((person) => (
          <div key={person.id} onClick={() => handleSelectedUser(person)}>
            <User isSelected={selectedUsers.includes(person)} person={person} />
          </div>
        ))}
      </div>
      <AnimatePresence>
        {!!selectedUsers.length && (
          <motion.div
            variants={container}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="absolute bottom-6 right-6"
          >
            <div
              onClick={onSubmit}
              className="btn btn-circle btn-primary text-white grid place-items-center size-14 bg-primary rounded-full overflow-hidden"
            >
              <motion.svg
                initial={item.hidden}
                animate={item.visible}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="size-6"
              >
                <path
                  fillRule="evenodd"
                  d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
                  clipRule="evenodd"
                />
              </motion.svg>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
