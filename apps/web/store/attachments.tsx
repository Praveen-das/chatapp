import { Blob } from "buffer";
import { create } from "zustand";

interface IAttachmentsContext {
    imageSelectionModal: boolean
    setImageSelectionModal: (action: boolean) => void,

    images: IImagePayload[]
    addImages: (payload: IImagePayload[]) => void
    removeImages: (index: number) => void
    clearImages: () => void

    mediaStore: IMediaStore
    setMediaStore: (conversationId: string, userMedia: IUserMedia) => void
    addToMediaStore: (conversationId: string, type: keyof IUserMedia, attachment: IAttachment[]) => void

    selectedAttachment: IImageAttachment | null
    setSelectedAttachment: (attachment: IImageAttachment | null) => void
}

interface IImagePayload {
    thumbnail: string,
    file: File,
}

export const useAttachments = create<IAttachmentsContext>((set, get) => {
    return {
        imageSelectionModal: false,
        setImageSelectionModal: (action) => set({ imageSelectionModal: action }),

        images: [],
        addImages: (payload: IImagePayload[]) => set(s => ({ images: [...payload, ...s.images] })),
        removeImages: (index: number) => set(s => {
            const images = s.images

            images.splice(index, 1)

            return { images: images.slice() }
        }),
        clearImages: () => set(s => ({ images: [] })),

        mediaStore: new Map(),
        setMediaStore: (conversationId, userMedia) => set({ mediaStore: new Map().set(conversationId, userMedia) }),
        addToMediaStore: (conversationId, type, attachment) => {

            const mediaStore = get().mediaStore
            let userMedia = mediaStore.get(conversationId)

            mediaStore.set(conversationId, { ...userMedia, [type]: [...attachment, ...userMedia?.[type] || []] })

            set({ mediaStore: new Map(mediaStore) })
        },

        selectedAttachment: null,
        setSelectedAttachment: (attachment) => set({ selectedAttachment: attachment })
    }
})
