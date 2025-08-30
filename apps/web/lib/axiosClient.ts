import axios from "axios";

const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL;
const axiosClient = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
});

export default axiosClient;
