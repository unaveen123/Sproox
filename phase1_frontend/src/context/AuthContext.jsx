import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }

    const loadProfile = async () => {
      try {
        const res = await api.get("/auth/me");
        setUser(res.data);
      } catch (err) {
        console.warn("Unable to load profile", err?.response?.data || err.message);
      }
    };

    loadProfile();
  }, [token]);

  const login = async ({ email, password }) => {
    setLoading(true);
    setError(null);

    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);
      formData.append("grant_type", "password");

      const res = await api.post("/auth/login", formData, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      localStorage.setItem("token", res.data.access_token);
      setToken(res.data.access_token);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Login failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signup = async ({ name, email, phone, password, confirmPassword }) => {
    setLoading(true);
    setError(null);

    try {
      const res = await api.post("/auth/register", {
        name,
        email,
        phone,
        password,
        confirm_password: confirmPassword,
      });

      return res.data;
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Signup failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({ token, user, loading, error, login, signup, logout }),
    [token, user, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
