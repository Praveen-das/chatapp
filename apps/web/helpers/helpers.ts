import { isEqual } from 'lodash'

export function upsertUpdates(updates: IUpdates, update: IUpdatesCollection, key: string) {
    updates.has(key) ?
        updates.get(key)?.push(update) :
        updates.set(key, [update]);
    return updates
}

export function upsert(array1: any[], item: any, key: string) {
    array1 = array1.filter(_item => _item[key] !== item[key])
    return [item, ...array1]
}

export function generateConversation(id1: string, id2: string): IIConversation {
    return {
        id: crypto.randomUUID(),
        host: 'user',
        members: [id1, id2],
        createdAt: Date.now(),
        updatedAt: Date.now(),
    }
}

export const compressImage = async (dataUrl: string): Promise<string> => {
    const img = new Image();
    img.src = dataUrl;

    return await new Promise((res) => {
        img.onload = () => {
            const maxWidth = 500; // Set the max width for the thumbnail
            const maxHeight = 500; // Set the max height for the thumbnail
            let width = img.width;
            let height = img.height;

            // Calculate the aspect ratio and set the thumbnail dimensions
            if (width > height) {
                if (width > maxWidth) {
                    height = Math.round((height *= maxWidth / width));
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width = Math.round((width *= maxHeight / height));
                    height = maxHeight;
                }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);

            res(canvas.toDataURL());
        };
    })

};
