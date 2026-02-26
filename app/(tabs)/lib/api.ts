import axios from 'axios';

const api = axios.create({
  baseURL: 'https://specificethiopia.com/inventory/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;