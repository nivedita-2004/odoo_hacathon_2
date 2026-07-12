const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${BASE_URL}/auth/login`,
    REGISTER: `${BASE_URL}/auth/register`,
    VERIFY_REGISTER: `${BASE_URL}/auth/verify-registration-otp`,
    GOOGLE: `${BASE_URL}/auth/google`,
    GOOGLE_SELECT: `${BASE_URL}/auth/google/select-workspace`,
    GOOGLE_CREATE: `${BASE_URL}/auth/google/create-workspace`,
  },
  ASSETS: {
    GET_ALL: `${BASE_URL}/assets`,
    GET_BY_ID: (id) => `${BASE_URL}/assets/${id}`,
    CREATE: `${BASE_URL}/assets`,
  },
  USERS: {
    GET_ALL: `${BASE_URL}/users`,
    GET_BY_ID: (id) => `${BASE_URL}/users/${id}`,
  },
  DASHBOARD: {
    ADMIN: `${BASE_URL}/dashboard/admin`,
  }
};
