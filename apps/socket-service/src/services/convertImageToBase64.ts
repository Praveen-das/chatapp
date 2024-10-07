import { getPlaiceholder } from "plaiceholder";

export default async function convertImageToBase64(src:string) {
  try {
    const buffer = await fetch(src)
      .then((res) => res.arrayBuffer())
      .catch((res) => console.log(res));

    if (!buffer) return;

    const { base64 } = await getPlaiceholder(Buffer.from(buffer));

    return base64;
  } catch (e) {
    if (e instanceof Error) console.log(e.stack);
  }
}
