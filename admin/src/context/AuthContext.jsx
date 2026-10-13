import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuthToken, setAuthToken, removeAuthToken, getAdminMe, loginAdmin } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      const token = getAuthToken();
      if (token) {
        try {
          const res = await getAdminMe();
          if (res.success && res.admin) {
            setAdmin(res.admin);
          } else {
            removeAuthToken();
          }
        } catch (err) {
          console.warn('Auth token validation failed:', err);
          removeAuthToken();
        }
      }
      setLoading(false);
    };

    const handleExpired = () => {
      setAdmin(null);
    };
    window.addEventListener('auth_expired', handleExpired);

    initAuth();
    return () => window.removeEventListener('auth_expired', handleExpired);
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const res = await loginAdmin(email, password);
      if (res.success && res.token) {
        setAuthToken(res.token);
        setAdmin(res.admin);
        return res;
      }
      throw new Error(res.message || 'Login failed');
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = () => {
    removeAuthToken();
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
