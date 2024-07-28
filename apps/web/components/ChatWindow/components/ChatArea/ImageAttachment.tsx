import { useAttachments } from "../../../../store/attachments";

const ImageAttachment = ({ attachment }: IAttachmentBox) => {
    const setSelectedAttachment = useAttachments(s => s.setSelectedAttachment)

    const handleClick = () => {
        (document?.getElementById('my_modal_2') as HTMLDialogElement)?.showModal()
        setSelectedAttachment(attachment.data);
    }

    return (
        <>
            <div
                onClick={handleClick}
                className="max-h-[300px] max-w-[300px] overflow-hidden rounded-xl"
            >
                <img src={attachment.data.thumbnail} className={`${attachment.status === 'loaded' ? 'blur' : 'blur-none'} duration-200 h-full`} alt="" />
            </div>
        </>
    )
}

export default ImageAttachment