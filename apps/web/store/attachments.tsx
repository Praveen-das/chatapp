import { create } from "zustand";
import {
  IAttachment,
  IImageAttachment,
  IImagePayload,
  IMediaStore,
  IUrlAttachment,
  IUserMedia,
} from "@repo/interfaces/messageInterface";

interface State {
  imageSelectionModal: boolean;
  images: IImagePayload[];
  mediaStore: IMediaStore;
  selectedAttachment: IImageAttachment | null;
}

interface Actions {
  setImageSelectionModal: (action: boolean) => void;
  addImages: (payload: IImagePayload[]) => void;
  removeImages: (index: number) => void;
  clearImages: () => void;
  setMediaStore: (conversationId: string, userMedia: IUserMedia) => void;
  addToMediaStore: (conversationId: string, type: keyof IUserMedia, attachment: IAttachment[]) => void;
  setSelectedAttachment: (attachment: IImageAttachment | null) => void;
  reset: () => void;
}

type IAttachmentsContext = State & Actions;

const getInitialState = (): State => ({
  imageSelectionModal: false,
  images: [],
  mediaStore: new Map(),
  selectedAttachment: null,
});

export const useAttachments = create<IAttachmentsContext>((set, get) => {
  return {
    ...getInitialState(),
    reset: () => set(getInitialState()),
    setImageSelectionModal: (action) => set({ imageSelectionModal: action }),
    addImages: (payload: IImagePayload[]) => set((s) => ({ images: [...payload, ...s.images] })),
    removeImages: (index: number) =>
      set((s) => {
        const images = s.images;

        images.splice(index, 1);

        return { images: images.slice() };
      }),
    clearImages: () => set((s) => ({ images: [] })),

    setMediaStore: (conversationId, newUserMedia) =>
      set((s) => {
        const mediaStore = get().mediaStore;

        const existingMedia = mediaStore.get(conversationId);

        if (!existingMedia) mediaStore.set(conversationId, newUserMedia);
        else {
          Object.keys(newUserMedia).forEach((k) => {
            const key = k as keyof typeof newUserMedia;
            const newItems = newUserMedia[key] as any;
            if (existingMedia[key]) {
              existingMedia[key]!.unshift(...newItems);
            } else {
              existingMedia[key] = newItems;
            }
          });
        }

        return {
          mediaStore: new Map(mediaStore),
        };
      }),
    addToMediaStore: (conversationId, type, attachment) => {
      const mediaStore = get().mediaStore;
      let userMedia = mediaStore.get(conversationId);

      mediaStore.set(conversationId, {
        ...userMedia,
        [type]: [...attachment, ...(userMedia?.[type] || [])],
      });

      set({ mediaStore: new Map(mediaStore) });
    },

    setSelectedAttachment: (attachment) => set({ selectedAttachment: attachment }),
  };
});
