import axios from 'axios';

export const API = axios.create({
  baseURL: 'https://spinners-backend-1.onrender.com/api',
});
