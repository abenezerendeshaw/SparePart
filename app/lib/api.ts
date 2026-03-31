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

  // Add cache-busting for GET requests
  if (config.method?.toLowerCase() === 'get') {
    config.params = {
      ...config.params,
      _t: Date.now()
    };
  }

  // Debug: log non-GET requests to help diagnose server issues
  try {
    if (config.method && config.method.toLowerCase() !== 'get') {
      console.log('API Request:', {
        method: config.method,
        url: config.baseURL + (config.url || ''),
        params: config.params,
        data: config.data,
      });
    }
  } catch (e) {
    // ignore logging errors
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    try {
      console.log('API Response:', {
        method: response.config?.method,
        url: response.config?.url,
        status: response.status,
        data: response.data,
      });
    } catch (e) {
      // ignore
    }
    return response;
  },
  async (error) => {
    try {
      console.error('API Error response:', error?.response?.status, error?.response?.data);
    } catch (e) {
      // ignore
    }
    if (error.response?.status === 401) {
      await storage.removeItem("authToken");
    }
    return Promise.reject(error);
  }
);

export default api;