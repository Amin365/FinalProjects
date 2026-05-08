import axios from "axios";
import store from "../store.js";

const Api_URL = process.env.NODE_ENV === "production"
  ? "https://degahburpubliclibrary.page/api"
  : "http://localhost:5000/api";



  
const api = axios.create({
  baseURL: Api_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

//  Attach token on requests
api.interceptors.request.use((config) => {
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  if (config.skipAuth) {
    delete config.skipAuth;
    return config;
  }

  const state = store.getState();
  const token = state.auth?.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
