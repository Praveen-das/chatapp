import axios from "axios"

const baseURL = 'http://localhost:3001/db'

const axiosClient = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json'
    },
    
})

export default axiosClient