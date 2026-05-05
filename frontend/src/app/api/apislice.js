import axios from "axios";
import store from "../store.js";

const Api_URL = process.env.NODE_ENV === "production"
  ? "http://http://142.93.53.101/api"
  : "http://localhost:5000/api";


const api = axios.create({
  baseURL: Api_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Attach token on requests
api.interceptors.request.use((config) => {
  const state = store.getState();
  const token = state.auth?.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
