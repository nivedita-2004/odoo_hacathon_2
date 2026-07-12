const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${BASE_URL}/auth/login`,
    REGISTER: `${BASE_URL}/auth/register`,
    VERIFY_REGISTER: `${BASE_URL}/auth/verify-registration-otp`,
    GOOGLE: `${BASE_URL}/auth/google`,
    GOOGLE_SELECT: `${BASE_URL}/auth/google/select-workspace`,
    GOOGLE_CREATE: `${BASE_URL}/auth/google/create-workspace`,
    WORKSPACE_SELECT: `${BASE_URL}/auth/workspace/select`,
    WORKSPACE_CREATE: `${BASE_URL}/auth/workspace/create`,
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
  },
  ORGANIZATION: {
    SETUP: `${BASE_URL}/organization/setup`,
    BRANCHES: `${BASE_URL}/organization/branches`,
    DEPARTMENTS: `${BASE_URL}/organization/departments`,
    CATEGORIES: `${BASE_URL}/organization/categories`,
    EMPLOYEES: `${BASE_URL}/organization/employees`,
    SAAS_SETUP: `${BASE_URL}/organization/saas-setup`,
    ROLES: `${BASE_URL}/organization/roles`,
    PERMISSIONS: `${BASE_URL}/organization/permissions`,
    BRANDING: `${BASE_URL}/organization/branding`,
    NOTIFICATIONS: `${BASE_URL}/organization/notifications`,
  },
  ASSETS: {
    BASE: `${BASE_URL}/assets`,
    METADATA: `${BASE_URL}/assets/metadata`,
    IMPORT: `${BASE_URL}/assets/import`
  }
};
