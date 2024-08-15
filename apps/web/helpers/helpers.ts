import axios from "axios";

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

export function generateConversation(sender: IUser, receiver: IUser): IConversation {
    return {
        id: crypto.randomUUID(),
        displayName: receiver.username,
        host: 'user',
        members: [sender, receiver],
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

export function downloadFromUrl(url: string) {
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'fileName'); // Only works for same-origin URLs
    document.body.appendChild(link);
    link.click();
    link.remove();
}

export function getSystemTheme() {
    return getComputedStyle(document.documentElement).getPropertyValue('--theme');
}

export function isValidURL(string: string) {
    try {
        new URL(string);
        return true;
    } catch (err) {
        return false;
    }
}

export async function getUrlMetadata(url: string) {
    return await axios.post<IUrlMetadata>(
        'https://api.linkpreview.net', {
        q: url,
        key: '8f338d5964a4b9bfb931991a9211bb18'
      })
        .then(res => res.data)
        .catch(res => {
          console.log(res)
          throw res
        })
}





