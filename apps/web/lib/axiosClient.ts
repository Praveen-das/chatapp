import axios from "axios";

const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL
console.log(baseURL)
//  || 'http://localhost:3001';
const axiosClient = axios.create({ baseURL, headers: { "Content-Type": "application/json" } });

export default axiosClient;
