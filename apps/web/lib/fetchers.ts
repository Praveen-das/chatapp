import { IUrlMetadata } from "@repo/interfaces/messageInterface";
import axios from "axios";

export async function getUrlMetadata(url: string) {
  return await axios
    .post<IUrlMetadata>("https://api.linkpreview.net", {
      q: url,
      key: "8f338d5964a4b9bfb931991a9211bb18",
    })
    .then((res) => res.data)
    .catch((res) => {
      console.log(res);
      throw res;
    });
}
