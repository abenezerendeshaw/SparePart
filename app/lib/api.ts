import axios from "axios";
import storage from "./storage";

// Main API for inventory (your existing one)
const api = axios.create({
  baseURL: "https://specificethiopia.com/inventory/api/v1",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// Auth API for login, register, forgot password etc.
export const authApi = axios.create({
  baseURL: "https://specificethiopia.com/api",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// Add interceptors to both
const addInterceptors = (axiosInstance: any) => {
  axiosInstance.interceptors.request.use(async (config: any) => {
    const token = await storage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  axiosInstance.interceptors.response.use(
    (response: any) => response,
    async (error: any) => {
      if (error.response?.status === 401) {
        await storage.removeItem("authToken");
      }
      return Promise.reject(error);
    }
  );
};

addInterceptors(api);
addInterceptors(authApi);

export default api; // Keep default export for backward compatibility