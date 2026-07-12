import { ROLES } from "./roles";

export const MOCK_USERS = [
  {
    fullName: "AssetFlow Admin",
    email: "admin@assetflow.com",
    password: "admin123",
    role: ROLES.ADMIN,
  },
  {
    fullName: "Asset Manager",
    email: "manager@assetflow.com",
    password: "manager123",
    role: ROLES.ASSET_MANAGER,
  },
  {
    fullName: "Department Head",
    email: "head@assetflow.com",
    password: "head123",
    department: "Information Technology",
    role: ROLES.DEPARTMENT_HEAD,
  },
  {
    fullName: "Priya Sharma",
    email: "employee@assetflow.com",
    employeeId: "EMP001",
    department: "Information Technology",
    password: "employee123",
    role: ROLES.EMPLOYEE,
  },
];
