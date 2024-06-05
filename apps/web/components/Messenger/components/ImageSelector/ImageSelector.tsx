import React, { ChangeEvent, DOMAttributes, MouseEvent, MouseEventHandler, useEffect, useState } from 'react'
import Picker from '../ChatInput/Picker'
import { useAttachments } from '../../../../store/attachments';
import InputButton from '../../../ui/InputButton';
import _Image from 'next/image';
import { useMessages } from '../../../../store/messageStore';
import { useStore } from '../../../../store/global';
import { compressImage } from '../../../../helpers/helpers';
import useMessage from '../../../../hooks/useMessage';

type IImagesPayload = { message?: string, url: string }[]

const _images: IImagesPayload = Array(5)
    .fill(null)
    .map(() => ({ url: 'https://images.unsplash.com/photo-1575936123452-b67c3203c357?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8aW1hZ2V8ZW58MHx8MHx8fDA%3D' }))

function ImageSelector() {
    const images = useAttachments(s => s.images)
    const addImages = useAttachments(s => s.addImages)
    const removeImages = useAttachments(s => s.removeImages)
    const clearImages = useAttachments(s => s.clearImages)

    const setMessageStore = useMessages(s => s.setMessageStore);
    const selectedConversation = useStore(s => s.selectedConversation);
    const { generateMessageTemplate } = useMessage()

    const [open, setOpen] = useState(false)
    const [messages, setMessages] = useState(Array(images.length).fill(''));
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

        messages.push('')
        setSelectedIndex(0)
        setMessages(messages)
        addImages(files)
    }

    const handleMessageInput = (e: ChangeEvent<HTMLInputElement>) => {
        messages[selectedIndex] = e.target.value

        setMessages([...messages])
    }

    const handleSendingAttachment = () => {
        const req = images.map(({ file, thumbnail }, i) => {
            let string = messages[i]
            let attachment: IAttachment = {
                url: URL.createObjectURL(file),
                thumbnail,
                isUploaded: false,
                type: 'image',
                size: file.size
            }

            const message = generateMessageTemplate(string, attachment)

            return message
        })

        const conversationId = selectedConversation?.id!

        clearImages()
        setMessageStore(conversationId, req);
    }

    const removeImage = (index: number, e: MouseEvent<HTMLDivElement>) => {
        e.stopPropagation()

        messages.splice(index, 1)
        if (messages.length === 1) setSelectedIndex(0)
        setMessages(messages.slice())
        removeImages(index)
    }

    return (
        <>
            <Picker open={open} onEmojiSelect={console.log} />
            <div className='flex flex-col gap-6 items-center h-full bg-gradient-to-t from-zinc-700 px-4 rounded-2xl overflow-hidden' >
                <div className='flex flex-col w-full h-full overflow-hidden'>
                    <_Image width={500} height={500} className='w-full h-full object-contain' src={images[selectedIndex]?.thumbnail!} alt="" />
                </div>
                <div className='flex items-center px-2 gap-1 w-full max-w-sm h-[40px] rounded-md bg-zinc-700'>
                    <div onClick={() => setOpen(s => !s)} className="btn btn-circle btn-ghost btn-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
                        </svg>
                    </div>
                    <input
                        value={messages[selectedIndex]}
                        onChange={handleMessageInput}
                        className="w-full h-full bg-transparent outline-none border-none ml-2"
                        type="text"
                    />
                </div>
                <div className='grid gap-2 items-center w-full px-4 my-10 ' style={{ gridTemplateColumns: '1fr min-content' }}>
                    <div className='grid justify-center gap-2 items-center h-20' style={{ gridTemplateColumns: 'auto min-content' }}>
                        <div className='flex h-full items-center space-x-2 overflow-scroll no-scrollbar p-1'>
                            {
                                images
                                    // files
                                    .map((image, i) => (
                                        <div
                                            key={i}
                                            onClick={() => setSelectedIndex(i)}
                                            className={`${selectedIndex === i ? 'ring-[3px] ring-primary' : ''} group relative h-full aspect-square cursor-pointer rounded-md overflow-hidden`}
                                        >
                                            <div onClick={e => removeImage(i, e)} className='group-hover:opacity-100 btn btn-circle btn-xs btn-ghost absolute top-1 right-1 z-20 opacity-0'>
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                                </svg>
                                            </div>
                                            <_Image width={50} height={50} className='size-full object-cover rounded-md' src={image.thumbnail} alt="" />
                                            <span className='group-hover:opacity-50 absolute inset-0 bg-black opacity-0 duration-300 z-10'>
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
                            className="btn btn-circle btn-md btn-primary text-white justify-self-end"
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