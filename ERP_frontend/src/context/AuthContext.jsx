import { useMemo, useState } from "react";
import { ROLES } from "../config/roles";
import { MOCK_USERS } from "../config/mockUsers";
import { AuthContext } from "./auth-context";

const STORAGE_KEY = "assetflow_user";
const REGISTERED_USERS_KEY = "assetflow_registered_users";
const EMPLOYEES_KEY = "assetflow_employees";

const getRegisteredUsers = () => {
  try {
    return JSON.parse(localStorage.getItem(REGISTERED_USERS_KEY)) || [];
  } catch {
    return [];
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  });

  const login = (email, password) => {
    const match = [...MOCK_USERS, ...getRegisteredUsers()].find(
      (item) =>
        item.email === email.trim().toLowerCase() && item.password === password,
    );
    if (!match) return null;
    const directory = (() => {
      try {
        return (JSON.parse(localStorage.getItem(EMPLOYEES_KEY)) || []).find(
          (item) => item.email?.toLowerCase() === match.email.toLowerCase(),
        );
      } catch {
        return null;
      }
    })();
    if (directory?.status === "Inactive") return null;
    const safeUser = {
      fullName: directory?.name || match.fullName,
      email: match.email,
      employeeId: match.employeeId,
      department: directory?.department || match.department,
      role: directory?.role || match.role,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safeUser));
    setUser(safeUser);
    return safeUser;
  };

  const registerEmployee = ({ fullName, email, password }) => {
    const registeredUsers = getRegisteredUsers();
    const directory = (() => {
      try {
        return JSON.parse(localStorage.getItem(EMPLOYEES_KEY)) || [];
      } catch {
        return [];
      }
    })();
    const normalizedEmail = email.trim().toLowerCase();
    if (
      [...MOCK_USERS, ...registeredUsers].some(
        (item) => item.email.toLowerCase() === normalizedEmail,
      )
    )
      return {
        success: false,
        error: "An account with this email already exists.",
      };
    const usedEmployeeNumbers = [...MOCK_USERS, ...registeredUsers, ...directory]
      .map((item) => Number((item.employeeId || item.id)?.match(/\d+$/)?.[0]))
      .filter(Number.isFinite);
    const nextEmployeeNumber = Math.max(0, ...usedEmployeeNumbers) + 1;
    const generatedEmployeeId = `EMP${String(nextEmployeeNumber).padStart(3, "0")}`;
    const newEmployee = {
      fullName: fullName.trim(),
      email: normalizedEmail,
      employeeId: generatedEmployeeId,
      password,
      role: ROLES.EMPLOYEE,
    };
    localStorage.setItem(
      REGISTERED_USERS_KEY,
      JSON.stringify([...registeredUsers, newEmployee]),
    );
    if (!directory.some((item) => item.email?.toLowerCase() === normalizedEmail)) {
      localStorage.setItem(
        EMPLOYEES_KEY,
        JSON.stringify([
          ...directory,
          {
            id: generatedEmployeeId,
            name: newEmployee.fullName,
            email: newEmployee.email,
            department: "Unassigned",
            role: ROLES.EMPLOYEE,
            status: "Active",
          },
        ]),
      );
    }
    return { success: true, employeeId: generatedEmployeeId };
  };

  const requestPasswordOtp = (email) => {
    const normalizedEmail = email.trim().toLowerCase();
    const accountExists = [...MOCK_USERS, ...getRegisteredUsers()].some(
      (item) => item.email.toLowerCase() === normalizedEmail,
    );
    if (!accountExists) return { success: false, error: "No account was found with this email." };
    return { success: true, otp: "123456" };
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };
  const value = useMemo(
    () => ({
      user,
      isLoading: false,
      isAuthenticated: Boolean(user),
      login,
      registerEmployee,
      requestPasswordOtp,
      logout,
      hasRole: (role) => user?.role === role,
      hasAnyRole: (roles) => roles.includes(user?.role),
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
