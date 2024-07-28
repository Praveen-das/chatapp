import React, { ChangeEvent, DOMAttributes, MouseEvent, MouseEventHandler, useEffect, useState } from 'react'
import Picker from '../ChatInput/Picker'
import { useAttachments } from '../../../../store/attachments';
import InputButton from '../../../ui/InputButton';
import _Image from 'next/image';
import { useMessageStore } from '../../../../store/messageStore';
import { useStore } from '../../../../store/global';
import { compressImage } from '../../../../helpers/helpers';
import useMessage from '../../../../hooks/useMessage';
import useAuth from '../../../../hooks/useAuth';
import useSocket  from '../../../../context/SocketProvider';
import { useConversationStore } from '../../../../store/conversationStore';

function ImageSelector() {
    const { user } = useAuth()
    const images = useAttachments(s => s.images)
    const addImages = useAttachments(s => s.addImages)
    const removeImages = useAttachments(s => s.removeImages)
    const clearImages = useAttachments(s => s.clearImages)
    const addToMediaStore = useAttachments(s => s.addToMediaStore)

    const setMessageStore = useMessageStore(s => s.setMessageStore);
    const updateMessages = useMessageStore(s => s.updateUserMessages);
    const selectedConversation = useConversationStore(s => s.selectedConversation);
    const selectedUser = useStore(s => s.selectedUser);
    const { generateMessageTemplate } = useMessage()
    const { registerConversation, sendMessage } = useSocket();

    const [open, setOpen] = useState(false)
    const [captions, setCaptions] = useState(Array(images.length).fill(''));
    const [selectedIndex, setSelectedIndex] = useState(0);

    const handleAddingImages = async (e: ChangeEvent<HTMLInputElement>) => {
        const files = await Promise
            .all(Array
                .from(e.target.files!)
                .map(async (file) => {
                    const url = URL.createObjectURL(file)
                    const thumbnail = await compressImage(url)
                    return { thumbnail, file }
                }))

        if (!files?.length) return

        captions.push('')
        setSelectedIndex(0)
        setCaptions(captions)
        addImages(files)
    }

    const handleMessageInput = (e: ChangeEvent<HTMLInputElement>) => {
        captions[selectedIndex] = e.target.value

        setCaptions([...captions])
    }

    const handleSendingAttachment = async () => {
        const conversationId = selectedConversation?.id!
        const userMedia: IImageAttachment[] = []

        const payload = images.map(({ file, thumbnail }, i) => {
            let caption = captions[i]
            let attachment: IAttachment = {
                type: 'image',
                status: 'loaded',
                data: {
                    id: crypto.randomUUID(),
                    userId: user?.id!,
                    url: URL.createObjectURL(file),
                    thumbnail,
                }
            }

            const message = generateMessageTemplate(selectedConversation!, caption, attachment)

            return message
        })

        clearImages()
        setCaptions([])

        setMessageStore(conversationId, payload);

        await Promise.all(
            payload.map((message, i) => {
                return new Promise(res => {
                    setTimeout(async () => {
                        // if (captions[i]) return res(false)
                        if (message.attachment) message.attachment.status = 'uploaded'
                        updateMessages(conversationId, [message])
                        userMedia.push(message.attachment?.data!)
                        res(true)
                    }, i * 0)
                })
            }))

        addToMediaStore(conversationId, 'image', userMedia)

        sendMessage(payload, selectedConversation!);
        // registerConversation(conversation, payload)
    }

    const removeImage = (index: number, e: MouseEvent<HTMLDivElement>) => {
        e.stopPropagation()

        captions.splice(index, 1)
        if (captions.length === 1) setSelectedIndex(0)
        setCaptions(captions.slice())
        removeImages(index)
    }

    return (
        <>
            <Picker open={open} onEmojiSelect={console.log} />
            <div className='flex flex-col gap-6 items-center h-full bg-gradient-to-t from-base-100 px-4 rounded-2xl overflow-hidden' >
                <div className='flex flex-col w-full h-full overflow-hidden'>
                    <_Image width={500} height={500} className='w-full h-full object-contain' src={images[selectedIndex]?.thumbnail!} alt="" />
                </div>
                <div className='flex items-center px-2 gap-1 w-full max-w-sm h-[40px] rounded-md bg-base-100'>
                    <div onClick={() => setOpen(s => !s)} className="btn btn-circle btn-ghost btn-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
                        </svg>
                    </div>
                    <input
                        value={captions[selectedIndex]}
                        onChange={handleMessageInput}
                        className="w-full h-full bg-transparent outline-none border-none ml-2"
                        type="text"
                    />
                </div>
                <div className='grid gap-2 items-center w-full px-4 my-10 ' style={{ gridTemplateColumns: '1fr min-content' }}>
                    <div className='grid justify-center gap-2 items-center h-20' style={{ gridTemplateColumns: 'auto min-content' }}>
                        <div className='flex h-full items-center space-x-2 overflow-scroll no-scrollbar p-1'>
                            {
                                images.map((image, i) => (
                                    <div
                                        key={i}
                                        onClick={() => setSelectedIndex(i)}
                                        className={`${selectedIndex === i ? 'ring-[3px] ring-primary' : ''} group relative cursor-pointer rounded-md`}
                                    >
                                        <div onClick={e => removeImage(i, e)} className='group-hover:opacity-100 btn btn-circle btn-xs btn-ghost absolute top-[2px] right-[2px] z-20 opacity-0'>
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                            </svg>
                                        </div>
                                        <_Image width={50} height={50} className='h-16 min-w-16 object-cover rounded-md' src={image.thumbnail} alt="" />
                                        <span className='group-hover:opacity-50 absolute inset-0 bg-black rounded-md opacity-0 duration-300 z-10'>
                                        </span>
                                    </div>
                                ))}
                        </div>
                        <InputButton
                            className='btn btn-square btn-outline flex items-center justify-center size-16 border-2 rounded-md cursor-pointer mr-auto'
                            onInputChange={handleAddingImages}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                        </InputButton>
                    </div>
                    <div className='flex justify-center items-center h-full ml-4'>
                        <button
                            className="btn btn-circle btn-md btn-primary  justify-self-end"
                            onClick={handleSendingAttachment}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default ImageSelector