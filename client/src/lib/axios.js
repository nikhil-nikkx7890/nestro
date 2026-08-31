import axios from "axios";

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    withCredentials: true, // send the httpOnly auth cookie on every request

    headers: {
        "Content-Type": "application/json",
    },
});

export default api;