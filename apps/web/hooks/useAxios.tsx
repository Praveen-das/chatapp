import { useEffect } from "react";
import useAuth from "./useAuth";
import axiosClient from "@lib/axiosClient";


const useAxios = () => {
    const { refreshToken,accessToken } = useAuth();

    useEffect(() => {
        const requestIntercept = axiosClient.interceptors.request.use(
            config => {
                if (!config.headers['Authorization']) {
                    config.headers['Authorization'] = `Bearer ${accessToken}`;
                }
                return config;
            }, (error) => Promise.reject(error)
        );

        const responseIntercept = axiosClient.interceptors.response.use(
            response => response,
            async (error) => {
                const prevRequest = error?.config;
                if (error?.response?.status === 403 && !prevRequest?.sent) {
                    prevRequest.sent = true;
                    const {access_token} = (await refreshToken())!;
                    prevRequest.headers['Authorization'] = `Bearer ${access_token}`;
                    return axiosClient(prevRequest);
                }
                return Promise.reject(error);
            }
        );

        return () => {
            axiosClient.interceptors.request.eject(requestIntercept);
            axiosClient.interceptors.response.eject(responseIntercept);
        }
    }, [accessToken])

    return axiosClient;
}

export default useAxios;