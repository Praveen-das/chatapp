import axios from "axios";

const baseURL = process.env.NEXT_PUBLIC_API;
const axiosClient = axios.create({ baseURL, headers: { "Content-Type": "application/json" } });

export default axiosClient;
