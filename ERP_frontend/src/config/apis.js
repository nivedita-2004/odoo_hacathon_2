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
    BASE: `${BASE_URL}/assets`,
    METADATA: `${BASE_URL}/assets/metadata`,
    IMPORT: `${BASE_URL}/assets/import`,
    TIMELINE: (id) => `${BASE_URL}/assets/${id}/timeline`,
    HEALTH: (id) => `${BASE_URL}/assets/${id}/health`
  },
  USERS: {
    GET_ALL: `${BASE_URL}/users`,
    GET_BY_ID: (id) => `${BASE_URL}/users/${id}`,
  },
  DASHBOARD: {
    ADMIN: `${BASE_URL}/dashboard/admin`,
    NOTIFICATIONS: `${BASE_URL}/dashboard/notifications`,
    EXECUTIVE_BRIEFING: `${BASE_URL}/dashboard/executive-briefing`,
  },
  NOTIFICATIONS: {
    MARK_READ: (id) => `${BASE_URL}/notifications/${id}/read`,
    MARK_ALL_READ: `${BASE_URL}/notifications/read-all`,
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

  ALLOCATIONS: {
    BASE: `${BASE_URL}/allocations`,
    ALLOCATE: `${BASE_URL}/allocations/allocate`,
    RETURN: `${BASE_URL}/allocations/return`,
    RETURNS_HISTORY: `${BASE_URL}/allocations/returns`,
    TRANSFERS: `${BASE_URL}/allocations/transfers`,
    REQUEST_TRANSFER: `${BASE_URL}/allocations/transfers/request`,
    APPROVE_TRANSFER: (id) => `${BASE_URL}/allocations/transfers/${id}/approve`,
    REJECT_TRANSFER: (id) => `${BASE_URL}/allocations/transfers/${id}/reject`,
    REQUESTS: `${BASE_URL}/allocations/requests`,
    APPROVE_REQUEST: (id) => `${BASE_URL}/allocations/requests/${id}/approve`,
    REJECT_REQUEST: (id) => `${BASE_URL}/allocations/requests/${id}/reject`,
  },
  BOOKINGS: {
    BASE: `${BASE_URL}/bookings`,
    RESOURCES: `${BASE_URL}/bookings/resources`,
    CANCEL: (id) => `${BASE_URL}/bookings/${id}/cancel`,
    UPDATE: (id) => `${BASE_URL}/bookings/${id}`,
  },
  MAINTENANCE: {
    REQUESTS: `${BASE_URL}/maintenance/requests`,
    ENGINEERS: `${BASE_URL}/maintenance/engineers`,
    APPROVE: (id) => `${BASE_URL}/maintenance/requests/${id}/approve`,
    REJECT: (id) => `${BASE_URL}/maintenance/requests/${id}/reject`,
    ASSIGN: (id) => `${BASE_URL}/maintenance/requests/${id}/assign`,
    START: (id) => `${BASE_URL}/maintenance/requests/${id}/start`,
    RESOLVE: (id) => `${BASE_URL}/maintenance/requests/${id}/resolve`,
  },
  AUDITS: {
    BASE: `${BASE_URL}/audits`,
    AUDITORS: `${BASE_URL}/audits/auditors`,
    VERIFY: (id) => `${BASE_URL}/audits/${id}/verify`,
    CLOSE: (id) => `${BASE_URL}/audits/${id}/close`,
  },
  REPORTS: {
    BASE: `${BASE_URL}/reports`,
  },
  AI: {
    ASK: `${BASE_URL}/ai/ask`,
  }
};
