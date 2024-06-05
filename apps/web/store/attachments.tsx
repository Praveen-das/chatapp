import { Blob } from "buffer";
import { create } from "zustand";

interface IAttachmentsContext {
    imageSelectionModal: boolean
    setImageSelectionModal: (action: boolean) => void,

    images: IPayload[]
    addImages: (payload: IPayload[]) => void
    removeImages: (index: number) => void
    clearImages: () => void

}

interface IPayload {
    thumbnail: string,
    file: File,
}

export const useAttachments = create<IAttachmentsContext>((set, get) => {
    return {
        imageSelectionModal: false,
        setImageSelectionModal: (action) => set({ imageSelectionModal: action }),

        images: [],
        addImages: (payload: IPayload[]) => set(s => ({ images: [...payload, ...s.images] })),
        removeImages: (index: number) => set(s => {
            const images = s.images

            images.splice(index, 1)

            return { images: images.slice() }
        }),
        clearImages: () => set(s => ({ images: [] })),
    }
})
