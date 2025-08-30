"use client";

import { clearLocalSession, deleteCookie, refreshToken, validateRefreshToken } from "@actions/session";
import useAccessToken from "@hooks/useAccessToken";
import useAxios from "@hooks/useAxios";
import { signOut } from "next-auth/react";
import { cookies } from "next/headers";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

function Asd() {
  const setAccessToken = useAccessToken((state) => state.setAccessToken);
  const router = useRouter()

  useEffect(() => {
    (async () => {
      const token = await refreshToken();
      
      if(!token){
        await signOut({ redirect: false });
        router.replace('/register')
        return
      }

      setAccessToken(token);
    })();
  }, []);

  // const axios = useAxios();

  return (
    <div>
      <button
        onClick={async () => {
          try {
            // const res = await axios("/db/user/all")
            //   .then((res) => res.data)
            //   .catch((res) => res.data);

            // console.log(res);
          } catch (error) {
            console.log(error);
          }
        }}
      >
        update
      </button>
    </div>
  );
}

export default Asd;
