import { getUrlMetadata } from "@lib/fetchers";
import { parseUrl } from "@lib/utils";
import React, { useEffect, useState } from "react";

function useUrlParser(messageString: string) {
  const [metadata, setMetadata] = useState<IUrlMetadata | undefined>(undefined);

  useEffect(() => {
    const isUrl = parseUrl(messageString);

    (async () => {
      if (isUrl) {
        try {
          const response = await getUrlMetadata(messageString);
          setMetadata({ ...response });
        } catch (error: any) {
          setMetadata(undefined);
        }
      }
    })();
  }, [messageString]);

  return {metadata,setMetadata};
}

export default useUrlParser;
