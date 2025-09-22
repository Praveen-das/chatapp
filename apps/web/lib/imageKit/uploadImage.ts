import { IImagePayload } from "@repo/interfaces/messageInterface";
import { getAuthenticationParameters } from "./";
import imagekit from "./IKClient";

export async function uploadImage(
  file: File | string | Blob,
  fileName: string,
  useUniqueFileName?: boolean,
  callback?: (progress: number) => void
): Promise<IImagePayload> {
  const authData = await getAuthenticationParameters();

  const customXHR = new XMLHttpRequest();

  customXHR.upload.onprogress = (e) => {
    let totalSize = e.total;
    let loaded = e.loaded;
    let progress = Math.floor((loaded / totalSize) * 100);
    callback?.(progress);
  };

  return await imagekit.upload({
    file,
    fileName,
    folder: "/chat_app",
    xhr: customXHR,
    useUniqueFileName,

    token: authData.token,
    signature: authData.signature,
    expire: authData.expire,
  });
}
