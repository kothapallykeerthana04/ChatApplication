import { createContext, useContext, useState } from "react";
import axios from "../api/axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] =
    useState(JSON.parse(localStorage.getItem("user")) || null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);

  const login = async (email, password) => {
    const res = await axios.post("/auth/login", { email, password });
    if (res.data.error) throw new Error(res.data.error);

    setUser(res.data.user);
    setToken(res.data.token);

    localStorage.setItem("user", JSON.stringify(res.data.user));
    localStorage.setItem("token", res.data.token);
  };

  const register = async (username, email, password) => {
    await axios.post("/auth/register", { username, email, password });
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.clear();
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
