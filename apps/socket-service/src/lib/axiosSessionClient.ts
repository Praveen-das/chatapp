import axios from "axios";

const baseURL = process.env.SESSION_SERVICE_URL || "http://localhost:3001/session";

const axiosSessionClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default axiosSessionClient;
