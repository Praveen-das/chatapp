'use client';
import React, { useState, useMemo, useEffect, MouseEvent } from "react";
import useSocket from "../../context/SocketProvider";
import { useMessageStore } from "../../store/messageStore";
import { useStore } from "../../store/global";
import useAuth from "../../hooks/useAuth";
import { generateConversation } from "../../helpers/helpers";
import useMessage from "../../hooks/useMessage";
import { useConversationStore } from "../../store/conversationStore";
import { AnimatePresence, motion } from 'framer-motion'
import { Avatar } from "../Dashboard/Components/Avatar";
import moment from "moment";
import axiosClient from "../../lib/axiosClient";
import getLocalStorage from "../../lib/localStorage";
import SearchUser from "../Dashboard/Components/SearchUser";
import useSelectedConversation from "../../hooks/useSelectedConversation";
import AdminTag from "./AdminTag";
import { Menu } from "@headlessui/react";
import { useTabs } from "../Dashboard/Tabs/Tabs";
import { useRouter } from "next/navigation";

const closeModal = () => {
    (document?.getElementById('action-modal') as HTMLDialogElement)?.close()
}

const Modal = () => {
    const modal = useStore(s => s.modal)
    const setModal = useStore(s => s.setModal)
    const setSelectedChats = useMessageStore(s => s.setSelectedChats)

    const children = {
        forwardMessageModal: <ForwardMessageModal title="Forward Message to" />,
        sendLinkModal: <ForwardMessageModal title="Send link to" />,

        deleteMessageModal: <DeleteMessageModal />,
        addBlockedContactModal: <AddBlockedContactModal />,
        addGroupMembersModal: <AddGroupMembersModal />,
        joinGroupModal: <JoinGroupModal />,
        notificationBlockedAlert: <NotificationBlockedAlert />,
        allMembers: <AllMembers />,
    }

    function handleClose() {
        setModal(null)
        setSelectedChats(null);
        (document?.getElementById('action-modal') as HTMLDialogElement)?.close()
    }

    return (
        <dialog onClose={handleClose} id='action-modal' className="modal outline-none">
            {children[modal?.activeModal as keyof typeof children]}
            <form method="dialog" className="modal-backdrop bg-black/40">
                <button className="outline-none">close</button>
            </form>
        </dialog>
    )
}

const DeleteMessageModal = () => {
    const setSelectedChats = useMessageStore(s => s.setSelectedChats)
    const setModal = useStore(s => s.setModal)
    const selectedChats = useMessageStore(s => s.selectedChats)
    const selectedConversation = useConversationStore(s => s.selectedConversation)
    const { sendMessageDeleteRequest } = useSocket()
    const { user } = useAuth()

    const haveDeletedMsg = useMemo(() => selectedChats.some(msg => msg.message === "message deleted" || msg.from !== user?.id), [selectedChats, user])


    const handleMessageDelete = (deleteFor: { all?: true, userId?: string }) => {
        const conversationId = selectedConversation?.id!
        const to = selectedConversation?.members.find(m => m.id !== user?.id)!
        let messages = []

        if (deleteFor['all'])
            messages = selectedChats.map(message => ({ id: message.id, message: 'message deleted' }))
        else
            messages = selectedChats.map(message => ({ id: message.id, deletedFor: user?.id }))


        let req = { conversationId, to, messages }

        sendMessageDeleteRequest(req, Boolean(deleteFor['all']))
        setSelectedChats(null)
        setModal(null);
        closeModal()
    }

    return (
        <div className="modal-box flex flex-col justify-between p-8 h-44 gap-4 w-full max-w-xs bg-base-100 ">
            <div className="flex items-center justify-between">
                <label htmlFor="">Delete message ?</label>
                <form method="dialog">
                    <button className="btn btn-circle btn-sm btn-ghost">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z" clipRule="evenodd" />
                        </svg>
                    </button>
                </form>
            </div>
            <div className="flex w-full justify-stretch gap-4 mx-auto">
                <div className="w-full">
                    <button onClick={() => handleMessageDelete({ userId: user?.id })} className={`btn ${haveDeletedMsg && 'btn-outline btn-ghost btn-secondary'} btn-sm w-full`}>Delete for me</button>
                </div>
                {
                    !haveDeletedMsg &&
                    < div className="w-full">
                        <button onClick={() => handleMessageDelete({ all: true })} className="btn btn-sm btn-secondary w-full">Delete for all</button>
                    </div>
                }
            </div>
        </div >
    );
};

const AddGroupMembersModal = () => {
    const { user } = useAuth();
    const members = useConversationStore(s => s.selectedConversation)?.members
    const users = useStore(s => s.users).filter(u => u.id !== user?.id && !members?.find(m => m.id === u.id))
    const setModal = useStore(s => s.setModal)
    const [selectedUsers, setSelectedUsers] = useState<string[]>([])
    const { addMembersToGroup } = useSocket()
    const selectedConversation = useConversationStore(s => s.selectedConversation)

    const handleSelectedUser = (selectedUser: string) => {
        setSelectedUsers(s => {
            let selected = s.includes(selectedUser)
            if (selected)
                return s.filter(u => u !== selectedUser)
            return [selectedUser, ...s]
        })
    };

    function onSubmit() {
        addMembersToGroup(
            selectedConversation?.id!,
            selectedUsers
        )
        setModal(null);
        closeModal()
    }

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

    return (
        <div className="modal-box h-full px-0 pb-0 relative flex flex-col max-w-[450px] bg-base-100 ">
            <div className="flex px-6 justify-between items-center w-full ">
                <h3 className="font-medium text-lg">Select Contact</h3>
                <form method="dialog">
                    <button className="btn btn-circle btn-sm btn-ghost">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z" clipRule="evenodd" />
                        </svg>
                    </button>
                </form>
            </div>
            <div className="px-6 mt-4">
                <SearchUser />
            </div>
            <div className="w-full h-full space-y-2 overflow-y-scroll no-scrollbar mt-4 mb-2">
                {users.map((person) => (
                    <div key={person.id} onClick={() => handleSelectedUser(person.id)}>
                        <User isSelected={selectedUsers.some(s => s === person.id)} person={person} />
                    </div>
                ))}
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
        </div>
    );
};

const AllMembers = () => {
    const setSelectedUser = useStore(s => s.setSelectedUser)
    const setSelectedConversation = useConversationStore(s => s.setSelectedConversation)
    const selectedConversation = useSelectedConversation() as IGroupConversation
    const members = selectedConversation?.members
    const setProfileTab = useStore(s => s.setProfileTab)

    const toggleProfile = useStore(s => s.toggleProfile)
    const setModal = useStore(s => s.setModal)
    const [selectedUsers, setSelectedUsers] = useState<string[]>([])
    const { addMembersToGroup } = useSocket()

    const [dropdown, setDropdown] = useState({ visible: false, x: 0, y: 0 });
    const [user, setUser] = useState<IUser | null>(null);

    const handleSelectedUser = (selectedUser: string) => {
        setSelectedUsers(s => {
            let selected = s.includes(selectedUser)
            if (selected)
                return s.filter(u => u !== selectedUser)
            return [selectedUser, ...s]
        })
    };

    function onSubmit() {
        addMembersToGroup(selectedConversation?.id!, selectedUsers)
        setModal(null);
        closeModal()
    }

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

    const _members = useMemo(() => members.reduce((i, c) => {
        let char = c.username?.slice(0, 6)!
        let values = i.get(char)
        if (values) {
            values.push(c)
            values.sort((a, b) => (a.username!).localeCompare(b.username!))
        }
        else i.set(char, [c])

        return i
    }, new Map<string, IGroupMember[]>()), [members])

    const handleMenu = (event: MouseEvent<HTMLDivElement>, selectedUser: IUser) => {
        setDropdown({
            visible: true,
            x: event.clientX,
            y: event.clientY,
        });
        setUser(selectedUser)
    };

    const handleClose = () => {
        setDropdown({ ...dropdown, visible: false });
        setUser(null)
    };

    const handleSelectingUser = () => {
        setSelectedUser(user)
        setProfileTab('user')

        setModal(null)
        closeModal()
    };

    const handleMessagingUser = () => {
        setSelectedUser(user)
        setSelectedConversation(null)
        toggleProfile(false)

        setModal(null)
        closeModal()
    };

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
                        <SearchUser />
                    </div>
                    <div className="flex flex-col w-full h-full space-y-4 overflow-y-scroll no-scrollbar mt-4 mb-2">
                        {dropdown.visible ? <div onClick={handleClose} className="fixed z-10 inset-0" /> : <span />}
                        {Array.from(_members).map(([key, groupMembers]) => (
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
                        ))}
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

const AddBlockedContactModal = () => {
    const { user } = useAuth();
    const users = useStore(s => s.users)
    const setModal = useStore(s => s.setModal)
    const { sendUserBlockRequest } = useSocket()

    const handleSelectedUsers = (selectedUsers: IUser) => {
        const req = { blockedId: selectedUsers.id, createtAt: Date.now(), userId: user?.id! }

        sendUserBlockRequest(req)
        setModal(null);
        closeModal()
    };

    return (
        <div className="modal-box h-full px-0 pb-0 relative flex flex-col max-w-[450px] bg-base-100 ">
            <div className="flex px-6 justify-between items-center w-full ">
                <h3 className="font-medium text-lg">Select Contact</h3>
                <form method="dialog">
                    <button className="btn btn-circle btn-sm btn-ghost">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z" clipRule="evenodd" />
                        </svg>
                    </button>
                </form>
            </div>
            <div className="px-6 mt-4">
                <SearchUser />
            </div>
            <div className="w-full h-full space-y-2 overflow-y-scroll no-scrollbar mt-4 mb-2">
                {users.map((person) => (
                    <div key={person.id} onClick={() => handleSelectedUsers(person)}>
                        <User selectable={false} person={person} />
                    </div>
                ))}
            </div>
        </div>
    );
};

const NotificationBlockedAlert = () => {
    const setModal = useStore(s => s.setModal)

    return (
        <div className="modal-box relative flex flex-col gap-2 max-w-[450px] bg-base-300 ">
            <div className="flex justify-between items-center w-full ">
                <label className="font-bold text-lg" htmlFor="">Notifications disabled</label>
                <form method="dialog">
                    <button className="btn btn-circle btn-sm btn-ghost">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z" clipRule="evenodd" />
                        </svg>
                    </button>
                </form>
            </div>
            <label htmlFor="">You have denied notifications. Please enable them in your browser settings if you wish to receive notifications.</label>
        </div>
    );
};

const JoinGroupModal = () => {
    const { user } = useAuth()
    const [group, setGroup] = useState<IGroupConversation | null>(null)
    const { addMembersToGroup } = useSocket()
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const modal = useStore<IModal<string> | null>(s => s.modal)

    useEffect(() => {
        const invitationId = modal?.state

        async function joinGroup() {
            if (!invitationId) throw Error('invitationId not found')

            setLoading(true)

            await axiosClient(`/group/fetch/${invitationId}`)
                .then(res => {
                    const conversation = res.data[0]
                    if (conversation) setGroup(conversation)
                    else setGroup(null)
                    setLoading(false)
                })
                .catch(res => {
                    console.log(res)
                    setLoading(false)
                })

            getLocalStorage()?.removeItem('invitationId')
        }

        joinGroup()

    }, [modal])

    function handleClose() { closeModal() }

    function handleJoiningGroup() {
        addMembersToGroup(group?.id!, [user?.id!])
        handleClose()
        router.push('/')
    }

    return (
        <div className="modal-box p-8 relative flex gap-2 items-center flex-col max-w-[450px] bg-base-100">
            {
                !loading ? !group ?
                    <label htmlFor="">Group doesn't exist.</label>
                    :
                    <>
                        <Avatar size="120px" onlineIndication={false} />
                        <label className="mt-4" htmlFor="">{group.displayName}</label>
                        <label className="text-sm text-center text-white/20" htmlFor="">Created by {group.createdBy} on {moment(new Date(group.createdAt)).format('LT')}</label>
                        <div className="avatar-group -space-x-4 rtl:space-x-reverse">
                            {
                                group.members.map((member, i) => (
                                    i > 4 ? null :
                                        <div className="avatar">
                                            <div className="w-8">
                                                <img src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.jpg" />
                                            </div>
                                        </div>
                                ))
                            }
                            {
                                group.members.length > 5 &&
                                <div className="avatar placeholder">
                                    <div className="bg-neutral text-neutral-content w-8">
                                        <span>+{group.members.length - 5}</span>
                                    </div>
                                </div>
                            }
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-6">
                            <div onClick={handleClose} className="btn  btn-outline h-10 min-h-10 rounded-full">Cancel</div>
                            <div onClick={handleJoiningGroup} className="btn  btn-primary h-10 min-h-10 rounded-full">Join Group</div>
                        </div>
                    </> :
                    <span className="loading loading-spinner loading-lg my-16"></span>
            }
        </div>
    );
};

const ForwardMessageModal = ({ title }: { title: string }) => {
    const users = useStore(s => s.users)
    const { registerConversation, sendMessage } = useSocket();
    const conversations = useConversationStore(s => s.conversations)
    const selectedChats = useMessageStore(s => s.selectedChats)
    const setSelectedChats = useMessageStore(s => s.setSelectedChats)
    const setMessageStore = useMessageStore(s => s.setMessageStore)
    const { regenerateMessageTemplate } = useMessage()

    const [selectedUsers, setSelectedUsers] = useState<IUser[]>([]);
    const [selectedConversations, setSelectedConversations] = useState<IConversation[]>([]);

    const handleSelectedUsers = (user: IUser) => {
        setSelectedUsers(s => s.includes(user) ? s.filter(u => u.id !== user.id) : [user, ...s]);
    };

    const handleSelectedConversation = (conversation: IConversation) => {
        setSelectedConversations(s => s.includes(conversation) ? s.filter(u => u.id !== conversation.id) : [conversation, ...s]);
    };

    const handleMessageForward = () => {
        selectedConversations.forEach((conversation) => {
            let messages = selectedChats.map(message => {
                let newMessage = regenerateMessageTemplate(conversation, message)
                return newMessage
            })

            sendMessage(messages, conversation);
            setMessageStore(conversation.id, messages)
            registerConversation(conversation, messages.at(-1))
        })

        selectedUsers.forEach((user) => {
            let conversation = generateConversation(user!, user)

            let messages = selectedChats.map(message => {
                let newMessage = regenerateMessageTemplate(conversation, message)
                return newMessage
            })

            sendMessage(messages, conversation);
            setMessageStore(conversation.id, messages)
            registerConversation(conversation, messages.at(-1))
        })

        setSelectedUsers([])
        setSelectedConversations([])
        setSelectedChats(null)
        closeModal()
    };

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

    return (
        <div className="modal-box h-full px-0 relative flex flex-col max-w-[450px] bg-base-100 ">
            <div className="flex px-6 justify-between items-center w-full">
                <h3 className="font-medium text-lg">{title}</h3>
                <form method="dialog">
                    <button className="btn btn-circle btn-sm btn-ghost">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z" clipRule="evenodd" />
                        </svg>
                    </button>
                </form>
            </div>
            <div className="px-6 mt-4">
                <SearchUser />
            </div>
            <div className="w-full h-full space-y-2 overflow-y-scroll no-scrollbar mt-4">
                <span className='flex w-full pl-6 pt-2 pb-1 text-sm'>Recents Chats</span>
                {conversations.map((conversation) => (
                    <div key={conversation.id} onClick={() => handleSelectedConversation(conversation)}>
                        <Conversation isSelected={selectedConversations.includes(conversation)} conversation={conversation} />
                    </div>
                ))}
                <span className='flex w-full pl-6 pt-2 pb-1 text-sm'>All Contacts</span>
                {users.map((person) => (
                    <div key={person.id} onClick={() => handleSelectedUsers(person)}>
                        <User isSelected={selectedUsers.includes(person)} person={person} />
                    </div>
                ))}
            </div>
            {/* <div className="flex items-center w-full h-20 bg-base-100 px-4 gap-2">
                <div className="flex items-center text-xs w-full h-full whitespace-nowrap overflow-hidden">
                    {placeholder.map((string, idx) => (
                        <Fragment key={string}>
                            <label className="truncate" htmlFor="">{string}</label>
                            {selectedUsers.length > 0 && selectedUsers.length !== idx + 1 ? ' , ' : ''}
                        </Fragment>
                    ))}
                </div>
                <form method="dialog">
                    <button disabled={!(selectedConversations.length + selectedUsers.length)} onClick={handleMessageForward}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                            <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                        </svg>
                    </button>
                </form>
            </div> */}

            <AnimatePresence>
                {
                    (!!selectedUsers.length || !!selectedConversations.length) &&
                    <motion.div
                        variants={container}
                        initial='hidden'
                        animate='visible'
                        exit='hidden'
                        className="absolute bottom-6 right-6"
                    >
                        <div
                            onClick={handleMessageForward}
                            className="btn btn-circle btn-primary text-white grid place-items-center size-14 bg-primary rounded-full overflow-hidden"
                        >
                            <motion.svg initial={item.hidden} animate={item.visible} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-6">
                                <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                            </motion.svg>
                        </div>
                    </motion.div>
                }
            </AnimatePresence>
        </div>
    );
};

function Conversation({ conversation, isSelected = false }: { conversation: IConversation; isSelected: boolean; }): React.JSX.Element {
    const displayName = conversation.host === 'group' ?
        (conversation as IGroupConversation).displayName :
        conversation.id

    return <div className='px-6 flex items-center hover:bg-black hover:bg-opacity-30 gap-4 w-full h-16 py-2 cursor-pointer'>
        <div className="h-full aspect-square rounded-full bg-base-200"></div>
        <div className="h-full w-full flex justify-between items-center">
            <label className="text-sm pointer-events-none" htmlFor="">{displayName}</label>
        </div>
        {isSelected ?
            <svg className="w-6 h-6 " xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
            </svg> : <span />
        }
    </div>;
}

function User({ person, isSelected = false, selectable = true }: { person: IUser; isSelected?: boolean, selectable?: boolean }): React.JSX.Element {
    return <div className='px-6 flex items-center hover:bg-black hover:bg-opacity-30 gap-4 w-full h-16 py-2 cursor-pointer'>
        <div className="h-full aspect-square rounded-full bg-base-200"></div>
        <div className="h-full w-full flex justify-between items-center">
            <label className="text-sm pointer-events-none" htmlFor="">{person.self ? 'yourself' + person.id : person.id}</label>
        </div>
        {(selectable && isSelected) ?
            <svg className="w-6 h-6 " xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
            </svg> : <span />
        }
    </div>;
}


export default Modal
