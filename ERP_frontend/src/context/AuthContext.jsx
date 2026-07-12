import { useMemo, useState } from "react";
import { AuthContext } from "./auth-context";
import { API_ENDPOINTS } from "../config/apis";

const STORAGE_KEY = "assetflow_user";
const TOKEN_KEY = "assetflow_token";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (stored && stored.role === "Admin") {
        stored.role = "ADMIN";
      }
      return stored;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(false);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
        localStorage.setItem(TOKEN_KEY, data.token);
        setUser(data.user);
        return data.user;
      }
      return null;
    } catch (error) {
      console.error("Login failed", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const registerEmployee = async ({ fullName, email, password }) => {
    setIsLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.AUTH.REGISTER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password }),
      });
      const data = await response.json();
      
      if (data.success) {
        return { success: true, message: data.message };
      }
      return { success: false, error: data.error || "Registration failed" };
    } catch (error) {
      console.error("Registration failed", error);
      return { success: false, error: "Network error. Please try again." };
    } finally {
      setIsLoading(false);
    }
  };

  const verifyRegistration = async (email, otp) => {
    setIsLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.AUTH.VERIFY_REGISTER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await response.json();

      if (data.success) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
        localStorage.setItem(TOKEN_KEY, data.token);
        setUser(data.user);
        return { success: true, user: data.user };
      }
      return { success: false, error: data.error || "Verification failed" };
    } catch (error) {
      console.error("Verification failed", error);
      return { success: false, error: "Network error. Please try again." };
    } finally {
      setIsLoading(false);
    }
  };

  const requestPasswordOtp = (email) => {
    return { success: true, otp: "123456" };
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      setUser,
      isLoading,
      isAuthenticated: Boolean(user),
      login,
      registerEmployee,
      verifyRegistration,
      requestPasswordOtp,
      logout,
      hasRole: (role) => user?.role === role || user?.role === "Admin",
      hasAnyRole: (roles) => roles.includes(user?.role) || user?.role === "Admin",
    }),
    [user, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
