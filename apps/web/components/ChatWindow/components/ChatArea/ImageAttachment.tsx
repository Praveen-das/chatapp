import { useAttachments } from "../../../../store/attachments";

const ImageAttachment = ({ attachment }: { attachment: IImageAttachment }) => {
    const setSelectedAttachment = useAttachments(s => s.setSelectedAttachment)

    const handleClick = () => {
        document?.querySelector<HTMLDialogElement>('#my_modal_2')?.showModal()
        setSelectedAttachment(attachment);
    }

    return (
        <>
            <div
                onClick={handleClick}
                className="max-h-[300px] w-full max-w-xs overflow-hidden rounded-xl"
            >
                <img src={attachment.thumbnail} className={`${attachment.status === 'loaded' ? 'blur' : 'blur-none'} min-w-[300px] duration-200 h-full`} alt="" />
            </div>
        </>
    )
}

export default ImageAttachment