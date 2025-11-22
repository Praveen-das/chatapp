import { IGroupConversation } from "@repo/interfaces/conversationInterface";
import { IUser } from "@repo/interfaces/userInterface";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import useSocket from "../../../context/SocketProvider";
import useAuth from "../../../hooks/useAuth";
import useSelectedConversation from "../../../hooks/useSelectedConversation";
import { useConversationStore } from "../../../store/conversationStore";
import { useStore } from "../../../store/global";
import FramerWrapper from "../MotionWrapper";
import SearchUser from "../Searchbar";
import ModalTitle from "./components/ModalTitle";
import { User } from "./components/User";
import { getActiveUsers, getUserFromMetadata } from "@lib/conversation";

export const AddGroupMembersModal = () => {
  const { user } = useAuth();
  const { addMembersToGroup } = useSocket();
  const setModal = useStore((s) => s.setModal);
  const selectedConversation = useSelectedConversation<IGroupConversation>();

  const [selectedUsers, setSelectedUsers] = useState<IUser[]>([]);
  const [query, setQuery] = useState("");

  if (!selectedConversation) return null;

  const members = useMemo(() => selectedConversation.members, [selectedConversation]);
  const users = useMemo(
    () => getActiveUsers().filter((u) => u.id !== user?.id && !members?.find((m) => m.userId === u.id)),
    [user, members]
  );

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

  async function onSubmit() {
    const {
      conversationId,
      admins,
      channelId,
      displayName,
      host,
      members,
      profilePicture,
      desc,
      invitationId,
      tags,
      createdBy,
    } = selectedConversation!;

    const existingUsers = members.reduce<IUser[]>((i, m) => {
      const u = getUserFromMetadata(m);
      if (u) i.push(u);
      return i;
    }, []);

    const group = {
      id: conversationId,
      admins,
      channelId: channelId!,
      displayName: displayName!,
      host,
      members,
      profilePicture,
      desc,
      invitationId,
      tags,
      createdBy: createdBy!,
    };

    addMembersToGroup({
      group,
      admin: user!,
      selectedUsers,
      existingUsers,
    });

    setModal(false);
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
    <FramerWrapper
      className={`modal-box max-sm:max-w-full max-sm:max-h-full max-sm:rounded-none max-sm:pt-4 max-sm:w-full max-sm:h-full h-full px-0 pb-0 relative flex flex-col max-w-[450px] bg-[--modal]`}
    >
      <ModalTitle>Select Contact</ModalTitle>
      <div className="max-sm:px-4 px-6 mt-4">
        <SearchUser query={query} onChange={setQuery} />
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
              className="btn btn-circle btn-primary text-[--black-white] grid place-items-center size-14 bg-primary rounded-full overflow-hidden"
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
    </FramerWrapper>
  );
};
