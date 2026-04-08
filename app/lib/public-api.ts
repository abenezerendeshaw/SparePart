import axios from "axios";

const publicApi = axios.create({
  baseURL: "https://specificethiopian.com/inventory/api/v1",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

export default publicApi;