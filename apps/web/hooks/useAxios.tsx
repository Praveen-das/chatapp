import { useEffect } from "react";
import axiosClient from "@lib/axiosClient";
import { clearLocalSession, refreshToken } from "@actions/session";
import useAccessToken from "./useAccessToken";

const useAxios = () => {
  const { accessToken, setAccessToken } = useAccessToken();

  useEffect(() => {
    let requestIntercept = axiosClient.interceptors.request.use(
      async (config) => {
        if (!config.headers["Authorization"]) {
          config.headers["Authorization"] = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    let responseIntercept = axiosClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        const prevRequest = error?.config;
        if (error?.response?.status === 401 && !prevRequest?.sent) {
          prevRequest.sent = true;
          console.log("refreshToken triggered!");
          const result = await refreshToken();

          if (result.token) {
            setAccessToken(result.token);
            prevRequest.headers["Authorization"] = `Bearer ${result.token}`;
            return axiosClient(prevRequest);
          }

          // Only clear session on definitive auth failure, not server outages
          if (result.error === "auth_failed") {
            clearLocalSession();
          }

          return Promise.reject(error);
        }
        return Promise.reject(error);
      },
    );

    return () => {
      axiosClient.interceptors.request.eject(requestIntercept);
      axiosClient.interceptors.response.eject(responseIntercept);
    };
  }, [accessToken]);

  return axiosClient;
};

export default useAxios;
