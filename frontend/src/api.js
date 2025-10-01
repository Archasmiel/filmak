import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

const API = axios.create({
  baseURL: API_BASE_URL || "http://localhost:5000/api",
  withCredentials: true,
  
});

API.interceptors.request.use(
  (req) => {
    const token = localStorage.getItem("token");
    if (token) {
      req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
  },
  (error) => {
    return Promise.reject(error);
  }
);

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response &&
      error.response.status === 401 &&
      error.response.data.error === "Token expired"
    ) {
      console.log("Token expired. Logging out...");
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default API;
