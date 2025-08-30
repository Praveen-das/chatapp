'use client'
import { IImagePayload } from "@repo/interfaces/messageInterface";
import moment from "moment";

export async function getImages(files: FileList) {
  try {
    if (!files) return;
    let promises = [];

    for (let file of files) {
      let promise = new Promise<IImagePayload>((res) => {
        const img = new Image();
        let objectURL = URL.createObjectURL(file);

        img.onload = () => {
          const width = img.width;
          const height = img.height;

          const response: IImagePayload = {
            fileId: crypto.randomUUID(),
            name: file.name,
            width,
            height,
            fileType: file.type,
            size: file.size,
            file,
            url: objectURL,
          };

          res(response);
        };

        img.src = objectURL;
      });

      promises.push(promise);
    }

    let images = Promise.all(promises);

    return images;
  } catch (e) {
    if (e instanceof Error) {
      console.log(e.stack);
    }
  }
}

export async function downloadFromUrl(url: string) {
  const response = await fetch(url, { mode: "cors" }); // or "no-cors" if you don't need the body
  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = 'fileName';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(blobUrl);
}

export function parseUrl(url: string) {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl;
  } catch (err) {
    return undefined;
  }
}

export function getRelativeTime(timeInMs: number) {
  const date = new Date(timeInMs);

  const currentTime = Date.now();
  const twentyFourHoursFromNow = currentTime - 24 * 60 * 60 * 1000;

  if (timeInMs > twentyFourHoursFromNow) {
    return "Active " + moment(date).startOf("minute").fromNow();
  } else {
    return "Last seen on " + moment(date).format("lll");
  }
}
