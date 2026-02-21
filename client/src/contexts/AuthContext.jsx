import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { API } from "../config/api";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  // ✅ load user immediately from localStorage (prevents mismatch)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  // Load user if token exists
  useEffect(() => {
    const token = localStorage.getItem("token");

    // ✅ no token => logout state
    if (!token) {
      localStorage.removeItem("user");
      setCurrentUser(null);
      setLoading(false);
      return;
    }

    // ✅ validate token + sync latest user
    axios
      .get(`${API.AUTH}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const user = res.data.user;

        // ✅ update state + localStorage in sync
        setCurrentUser(user);
        localStorage.setItem("user", JSON.stringify(user));
      })
      .catch(() => {
        // ✅ token invalid => full cleanup
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setCurrentUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = (user, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setCurrentUser(user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
