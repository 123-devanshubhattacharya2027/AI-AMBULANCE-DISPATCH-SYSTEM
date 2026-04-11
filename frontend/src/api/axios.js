import axios from "axios";

// ✅ CREATE AXIOS INSTANCE
const API = axios.create({
    baseURL: "http://localhost:5000/api",
    withCredentials: true, // optional but good practice
});

// 🔥 REQUEST INTERCEPTOR (ADD TOKEN)
API.interceptors.request.use(
    (req) => {
        const token = localStorage.getItem("token");

        console.log("🔥 AXIOS TOKEN:", token); // DEBUG

        if (token) {
            req.headers.Authorization = `Bearer ${token}`;
        }

        return req;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 🔥 RESPONSE INTERCEPTOR (HANDLE ERRORS)
API.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        console.error("❌ AXIOS ERROR:", error.response?.data || error.message);

        // 🚨 Auto logout if token invalid
        if (error.response?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");

            alert("Session expired. Please login again 🔐");

            window.location.href = "/login";
        }

        return Promise.reject(error);
    }
);

export default API;