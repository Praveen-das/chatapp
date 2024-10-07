import { IImagePayload } from "@interfaces/messageInterface";
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

export function downloadFromUrl(url: string) {
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "fileName"); // Only works for same-origin URLs
  document.body.appendChild(link);
  link.click();
  link.remove();
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
