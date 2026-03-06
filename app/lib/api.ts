import axios from "axios";
import storage from "./storage";

const api = axios.create({
  baseURL: "https://specificethiopia.com/inventory/api/v1",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  const token = await storage.getItem("authToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await storage.removeItem("authToken");
    }
    return Promise.reject(error);
  }
);

export default api;