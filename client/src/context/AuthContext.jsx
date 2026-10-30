import { createContext, useState, useEffect } from 'react';
import { signup as apiSignup, login as apiLogin, logout as apiLogout, getMe as apiGetMe } from '../api/auth.js';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiGetMe()
      .then((data) => {
        setUser(data.user || null);
        setError(null);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const signup = async (username, password) => {
    setError(null);
    try {
      const data = await apiSignup(username, password);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const login = async (username, password) => {
    setError(null);
    try {
      const data = await apiLogin(username, password);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    setError(null);
    try {
      await apiLogout();
    } finally {
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    error,
    setError,
    signup,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
