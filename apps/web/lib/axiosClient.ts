import axios from "axios"

const baseURL = 'http://192.168.1.7:3001/message'

const axiosClient = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json'
    },
    
})

export default axiosClient