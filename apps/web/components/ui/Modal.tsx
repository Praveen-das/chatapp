'use client';
import React, { Fragment, useState, ReactNode, forwardRef, useMemo } from "react";
import { useSocket } from "../../context/SocketProvider";
import { useMessages } from "../../store/messageStore";
import { useStore } from "../../store/global";
import { useAuth } from "../../context/AuthContext";
import { generateConversation } from "../../helpers/helpers";

const Modal = () => {
    const modalState = useStore(s => s.modalState)
    const setModalState = useStore(s => s.setModalState)
    const setSelectedChats = useMessages(s => s.setSelectedChats)

    const children = {
        forwardMessageModal: <ForwardMessageModal />,
        deleteMessageModal: <DeleteMessageModal />,
    }

    function handleClose() {
        setModalState(null)
        setSelectedChats(null)
    }

    return (
        <dialog onClose={handleClose} open={Boolean(modalState)} className="modal">
            {
                // children['deleteMessageModal']
                children[modalState as keyof typeof children]
            }
            <form method="dialog" className="modal-backdrop bg-black bg-opacity-40">
                <button>close</button>
            </form>
        </dialog>
    )
}

const DeleteMessageModal = () => {
    const setSelectedChats = useMessages(s => s.setSelectedChats)
    const setModalState = useStore(s => s.setModalState)
    const selectedChats = useMessages(s => s.selectedChats)
    const selectedConversation = useStore(s => s.selectedConversation)
    const { sendMessageDeleteRequest } = useSocket()
    const { user } = useAuth()

    const haveDeletedMsg = useMemo(() => selectedChats.some(msg => msg.message === "message deleted" || msg.from !== user?.id), [selectedChats, user])


    const handleMessageDelete = (deleteFor: { all?: true, userId?: string }) => {
        const conversationId = selectedConversation?.id!
        const to = selectedConversation?.members.find(m => m !== user?.id)!
        let messages = []

        if (deleteFor['all'])
            messages = selectedChats.map(message => ({ id: message.id, message: 'message deleted' }))
        else
            messages = selectedChats.map(message => ({ id: message.id, deletedFor: user?.id }))


        let req = { conversationId, to, messages }

        sendMessageDeleteRequest(req, Boolean(deleteFor['all']))
        setSelectedChats(null)
        setModalState(null)
    }

    return (
        <div className="modal-box flex flex-col justify-between p-8 h-44 gap-4 w-full max-w-xs bg-zinc-900 text-white">
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

const ForwardMessageModal = () => {
    const { users, onMessageForward, blockedByUsers, sendMessage } = useSocket();
    const conversations = useMessages(s => s.conversations)
    const selectedChats = useMessages(s => s.selectedChats)
    const setSelectedChats = useMessages(s => s.setSelectedChats)
    const { user } = useAuth()

    const [selectedUsers, setSelectedUsers] = useState<IUser[]>([]);

    const handleSelectedUsers = (user: IUser) => {
        setSelectedUsers(s => s.includes(user) ? s.filter(u => u.userId !== user.userId) : [user, ...s]);
    };

    const handleMessageForward = () => {
        selectedUsers.forEach(({ userId }) => {
            let conversation = conversations
                .find(({ members }) => members.includes(userId)) ||
                generateConversation(user?.id!, userId)

            const blockedByUser = blockedByUsers.some((u) => u.userId === userId)

            let messages = selectedChats.map(message => {
                if (blockedByUser) message = { ...message, deletedFor: [userId], to: '' }
                return message
            })

            onMessageForward(conversation, messages);
        })

        setSelectedUsers([])
        setSelectedChats(null)
    };

    return (
        <div className="modal-box h-full px-0 pb-0 relative flex flex-col max-w-[450px] bg-zinc-900 text-white">
            <div className="flex px-6 justify-between items-center w-full ">
                <h3 className="font-medium text-lg">Forward Message to</h3>
                <form method="dialog">
                    <button className="btn btn-circle btn-sm btn-ghost">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z" clipRule="evenodd" />
                        </svg>
                    </button>
                </form>
            </div>
            <div className="flex items-center px-6 gap-2 mt-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
                </svg>
                <input className="w-full h-8 bg-zinc-700 px-3 outline-none rounded-xl" type="text" />
            </div>
            <div className="w-full h-full space-y-2 overflow-y-scroll no-scrollbar mt-4">
                {users.map((person) => (
                    <div key={person.userId} onClick={() => handleSelectedUsers(person)}>
                        <User isSelected={selectedUsers.includes(person)} person={person} />
                    </div>
                ))}
            </div>
            <div className="flex items-center w-full h-20 bg-zinc-900 px-4 gap-2">
                <div className="flex items-center text-xs w-full h-full whitespace-nowrap overflow-hidden">
                    {selectedUsers.map((user, idx) => (
                        <Fragment key={user.userId}>
                            <label className="truncate" htmlFor="">{user.userId}</label>
                            {selectedUsers.length > 0 && selectedUsers.length !== idx + 1 ? ' , ' : ''}
                        </Fragment>
                    ))}
                </div>
                <form method="dialog">
                    <button onClick={handleMessageForward}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                            <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                        </svg>
                    </button>
                </form>
            </div>
        </div>
    );
};

function User({ person, isSelected = false }: { person: IUser; isSelected: boolean; }): React.JSX.Element {
    return <div className='px-6 flex items-center hover:bg-black hover:bg-opacity-30 gap-4 w-full h-16 py-2 cursor-pointer'>
        <div className="h-full aspect-square rounded-full bg-zinc-700"></div>
        <div className="h-full w-full flex justify-between items-center">
            <label className="text-sm pointer-events-none" htmlFor="">{person.self ? 'yourself' + person.userId : person.userId}</label>
        </div>
        {isSelected ?
            <svg className="w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
            </svg> : <span />
        }
    </div>;
}


export default Modal
