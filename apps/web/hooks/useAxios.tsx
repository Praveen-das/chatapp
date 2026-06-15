import { useEffect } from "react";
import axiosClient from "@lib/axiosClient";
import { clearLocalSession, refreshToken } from "@actions/session";
import useAccessToken from "./useAccessToken";

// Keep track of registered interceptors to prevent registering duplicates
let isInterceptorsRegistered = false;

// Refresh token queue — serializes concurrent 401 retries into a single refreshToken() call
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

/**
 * Ensures only one refreshToken() server action runs at a time.
 * All concurrent 401 callers share the same promise and receive the same result.
 */
function getRefreshedToken(
  setAccessToken: (token: string | null) => void,
): Promise<string | null> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = refreshToken()
    .then((result) => {
      if (result.token) {
        setAccessToken(result.token);
        return result.token;
      }

      if (result.error === "auth_failed") {
        clearLocalSession();
      }

      return null;
    })
    .catch(() => null)
    .finally(() => {
      isRefreshing = false;
      refreshPromise = null;
    });

  return refreshPromise;
}

const useAxios = () => {
  const { setAccessToken } = useAccessToken();

  useEffect(() => {
    if (typeof window === "undefined" || isInterceptorsRegistered) {
      return;
    }

    isInterceptorsRegistered = true;

    axiosClient.interceptors.request.use(
      async (config) => {
        const token = useAccessToken.getState().accessToken;

        // Check case-insensitively for existing Authorization header
        const hasAuth =
          config.headers &&
          (config.headers["Authorization"] ||
            config.headers["authorization"] ||
            (typeof config.headers.has === "function" && config.headers.has("Authorization")));

        if (!hasAuth && token) {
          if (config.headers && typeof config.headers.set === "function") {
            config.headers.set("Authorization", `Bearer ${token}`);
          } else {
            config.headers = config.headers || {};
            config.headers["Authorization"] = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    axiosClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        const prevRequest = error?.config;
        if (error?.response?.status === 401 && !prevRequest?.sent) {
          prevRequest.sent = true;

          const newToken = await getRefreshedToken(setAccessToken);

          if (newToken) {
            if (prevRequest.headers && typeof prevRequest.headers.set === "function") {
              prevRequest.headers.set("Authorization", `Bearer ${newToken}`);
            } else {
              prevRequest.headers = prevRequest.headers || {};
              prevRequest.headers["Authorization"] = `Bearer ${newToken}`;
            }

            return axiosClient(prevRequest);
          }

          return Promise.reject(error);
        }
        return Promise.reject(error);
      },
    );
  }, [setAccessToken]);

  return axiosClient;
};

export default useAxios;

