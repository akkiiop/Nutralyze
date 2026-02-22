import axios from "axios";

const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

const api = axios.create({
  baseURL: isLocal ? "http://localhost:8080" : "", // Empty for relative calls in prod
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
