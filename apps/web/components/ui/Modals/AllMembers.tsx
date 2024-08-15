import { Menu } from "@headlessui/react";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useMemo, MouseEvent, useEffect, LabelHTMLAttributes } from "react";
import useSocket from "../../../context/SocketProvider";
import useSelectedConversation from "../../../hooks/useSelectedConversation";
import { useConversationStore } from "../../../store/conversationStore";
import { Avatar } from "../../Dashboard/Components/Avatar";
import SearchUser from "../../Dashboard/Components/SearchUser";
import AdminTag from "../AdminTag";
import { useStore } from "../../../store/global";

const closeModal = () => {
    (document?.getElementById('action-modal') as HTMLDialogElement)?.close()
}

export const AllMembers = () => {
    const setSelectedUser = useStore(s => s.setSelectedUser)
    const setSelectedConversation = useConversationStore(s => s.setSelectedConversation)
    const setProfileTab = useStore(s => s.setProfileTab)
    const setModal = useStore(s => s.setModal)
    const toggleProfile = useStore(s => s.toggleProfile)
    const { addMembersToGroup, removeMemberFromGroup, makeAdmin, removeFromAdmin } = useSocket()

    const [selectedUsers, setSelectedUsers] = useState<string[]>([])
    const [dropdown, setDropdown] = useState({ visible: false, x: 0, y: 0 });
    const [user, setUser] = useState<IGroupMember | null>(null);
    const [query, setQuery] = useState('');

    const selectedConversation = useSelectedConversation() as IGroupConversation
    const members = selectedConversation?.members

    const container = {
        hidden: { scale: 0 },
        visible: {
            scale: 1,
            transition: {
                delayChildren: 0.1
            }
        }
    }

    const item = {
        hidden: { y: 50, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { delay: 0.1 } },
    }

    const _members = useMemo(() => {
        const ordered = members.reduce((i, c) => {
            let char = c.username?.slice(5, 6)!
            let values = i.get(char)

            if (values) {
                values.push(c)
                values.sort((a, b) => (a.username!).localeCompare(b.username!))
            }
            else i.set(char, [c])

            return i
        }, new Map<string, IGroupMember[]>())

        return Array.from(ordered).sort((a, b) => {
            if (a[0] < b[0]) return -1;
            if (a[0] > b[0]) return 1;
            return 0;
        })

    }, [members])

    const queryResult = useMemo(() => {
        if (!query) return []
        return members.filter(member => member.username.includes(query))
    }, [query, members])

    const handleMenu = (event: MouseEvent<HTMLDivElement>, selectedUser: IUser) => {
        setDropdown({
            visible: true,
            x: event.clientX,
            y: event.clientY,
        });
        setUser(selectedUser as IGroupMember)
    };

    function onSubmit() {
        addMembersToGroup(selectedConversation!, selectedUsers)
        setModal(null);
        closeModal()
    }

    const handleClose = () => {
        setDropdown({ ...dropdown, visible: false });
        setUser(null)
    };

    const handleSelectingUser = () => {
        setSelectedUser(user as IUser)
        setProfileTab('user')

        setModal(null)
        closeModal()
    };

    const handleMessagingUser = () => {
        setSelectedUser(user as IUser)
        setSelectedConversation(null)
        toggleProfile(false)

        setModal(null)
        closeModal()
    };

    function handleRemovingMember(userId: string) {
        removeMemberFromGroup(selectedConversation.id, userId)
        handleClose()
    }

    function handleAdmin(userId: string, action: string) {
        if (action === 'add') makeAdmin(selectedConversation.id, userId)
        else removeFromAdmin(selectedConversation.id, userId)
        handleClose()
    }

    return (
        <>
            <div className="fixed flex inset-0">
                <div onClick={() => {
                    setModal(null)
                    closeModal()
                }} className="fixed inset-0" />
                {dropdown.visible && <div onClick={handleClose} className="fixed inset-0" />}

                {
                    dropdown.visible &&
                    <Menu as="div" className="absolute bg-slate-600 inline-block text-left">
                        <Menu.Items style={{ top: dropdown.y, left: dropdown.x }} static className="absolute origin-top-right divide-y divide-gray-100 rounded-md bg-base-300 shadow-lg ring-1 ring-black/5 focus:outline-none z-10">
                            <div className="p-0.5">
                                <Menu.Item >
                                    <div
                                        className={`group btn btn-md w-full h-10 min-h-10 btn-ghost justify-start whitespace-nowrap`}
                                        onClick={handleSelectingUser}
                                    >
                                        View Profile
                                    </div>
                                </Menu.Item>
                                <Menu.Item >
                                    <div
                                        className={`group btn btn-md w-full h-10 min-h-10 btn-ghost justify-start`}
                                        onClick={handleMessagingUser}
                                    >
                                        Message
                                    </div>
                                </Menu.Item>
                                <Menu.Item >
                                    <div
                                        className={`group btn btn-md w-full h-10 min-h-10 btn-ghost justify-start whitespace-nowrap`}
                                        onClick={() => handleAdmin(user?.id!, user?.isAdmin ? 'remove' : 'add')}
                                    >
                                        {user?.isAdmin ? 'Remove Admin' : 'Make Admin'}
                                    </div>
                                </Menu.Item>
                                <Menu.Item >
                                    <div
                                        className={`group btn btn-md w-full h-10 min-h-10 btn-ghost justify-start`}
                                        onClick={() => handleRemovingMember(user?.id!)}
                                    >
                                        Remove
                                    </div>
                                </Menu.Item>
                            </div>
                        </Menu.Items>
                    </Menu>
                }
                <div className="m-auto modal-box h-full px-0 pb-0 relative flex flex-col max-w-[450px] bg-base-100 z-0">
                    <div className="flex px-6 justify-between items-center w-full ">
                        <h3 className="font-medium text-lg">Group members</h3>
                        <form method="dialog">
                            <button className="btn btn-circle btn-sm btn-ghost">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </form>
                    </div>
                    <div className="px-6 mt-4">
                        <SearchUser onChange={setQuery} highlightElm=".displayName" highlightResults />
                    </div>
                    <div className="flex flex-col w-full h-full space-y-4 overflow-y-scroll no-scrollbar mt-4 mb-2">
                        {dropdown.visible ? <div onClick={handleClose} className="fixed z-10 inset-0" /> : <span />}
                        {
                            query ?
                                queryResult.map(member => (
                                    <div
                                        onClick={e => handleMenu(e, member as IUser)}
                                        key={member.id}
                                        className='relative z-20 px-10 flex items-center hover:bg-black hover:bg-opacity-30 gap-4 w-full h-16 py-2'
                                    >
                                        <Avatar onlineIndication={false} />
                                        <div className="w-full flex gap-1 flex-col justify-between">
                                            <div className="flex justify-between items-center">
                                                <label
                                                    className="displayName text-sm "
                                                    htmlFor=""
                                                >
                                                    {member.username}
                                                </label>
                                                <AdminTag isAdmin={member.isAdmin} />
                                            </div>
                                            <div className="flex justify-between items-center text-white/25">
                                                <label className="text-sm max-w-1/3 truncate" htmlFor="">{member.bio || 'asd asdasd qwe zx'}</label>
                                                <label className="text-xs text-end" htmlFor="">+918848990353</label>
                                            </div>
                                        </div>
                                    </div>
                                )) :
                                _members.map(([key, groupMembers]) => (
                                    <div key={key}>
                                        <div className="w-full flex gap-2 items-end px-6 my-2">
                                            <label className="text-sm px-2 py-[2px] bg-primary rounded-lg" htmlFor="">{key}</label>
                                            <span className="w-full h-[2px] bg-black/30" />
                                        </div>
                                        {
                                            groupMembers.map(member => (
                                                <div
                                                    onClick={e => handleMenu(e, member as IUser)}
                                                    key={member.id}
                                                    className='relative z-20 px-10 flex items-center hover:bg-black hover:bg-opacity-30 gap-4 w-full h-16 py-2'
                                                >
                                                    <Avatar onlineIndication={false} />
                                                    <div className="w-full flex gap-1 flex-col justify-between">
                                                        <div className="flex justify-between items-center">
                                                            <label className="text-sm " htmlFor="">{member.username}</label>
                                                            <AdminTag isAdmin={member.isAdmin} />
                                                        </div>
                                                        <div className="flex justify-between items-center text-white/25">
                                                            <label className="text-sm max-w-1/3 truncate" htmlFor="">{member.bio || 'asd asdasd qwe zx'}</label>
                                                            <label className="text-xs text-end" htmlFor="">+918848990353</label>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        }
                                    </div>
                                ))
                        }
                    </div>
                    <AnimatePresence>
                        {
                            !!selectedUsers.length &&
                            <motion.div
                                variants={container}
                                initial='hidden'
                                animate='visible'
                                exit='hidden'
                                className="absolute bottom-6 right-6"
                            >
                                <div
                                    onClick={onSubmit}
                                    className="btn btn-circle btn-primary text-white grid place-items-center size-14 bg-primary rounded-full overflow-hidden"
                                >
                                    <motion.svg initial={item.hidden} animate={item.visible} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-6">
                                        <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                                    </motion.svg>
                                </div>
                            </motion.div>
                        }
                    </AnimatePresence>
                </div >
            </div>
        </>
    );
};