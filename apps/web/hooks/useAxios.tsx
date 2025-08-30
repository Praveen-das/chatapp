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
      (error) => Promise.reject(error)
    );

    let responseIntercept = axiosClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        const prevRequest = error?.config;
        if (error?.response?.status === 401 && !prevRequest?.sent) {
          prevRequest.sent = true;
          const access_token = await refreshToken();

          if (!access_token) {
            clearLocalSession();
            return Promise.reject(error);
          }

          setAccessToken(access_token);
          prevRequest.headers["Authorization"] = `Bearer ${access_token}`;
          return axiosClient(prevRequest);
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axiosClient.interceptors.request.eject(requestIntercept);
      axiosClient.interceptors.response.eject(responseIntercept);
    };
  }, [accessToken]);

  return axiosClient;
};

export default useAxios;
