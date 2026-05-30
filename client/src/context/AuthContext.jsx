import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Configure axios defaults on mount or token change
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }, [token]);

  // Load profile if token exists
  useEffect(() => {
    const loadProfile = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get('/api/auth/me');
        if (res.data.success) {
          setUser(res.data.data);
        }
      } catch (err) {
        console.error('Session expired or load failed:', err.response?.data?.error || err.message);
        // Clear invalid token
        setToken('');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [token]);

  // Register
  const register = async (name, email, password, role = 'Member') => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post('/api/auth/register', { name, email, password, role });
      if (res.data.success) {
        setToken(res.data.token);
        setUser(res.data.user);
        return true;
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Login
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      if (res.data.success) {
        setToken(res.data.token);
        setUser(res.data.user);
        return true;
      }
    } catch (err) {
      if (!err.response) {
        setError('Cannot reach server. Check that the backend is running and VITE_API_URL is set for production.');
      } else {
        setError(err.response?.data?.error || 'Invalid credentials');
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update Profile
  const updateProfile = async (fields) => {
    try {
      const res = await axios.put('/api/auth/me', fields);
      if (res.data.success) {
        setUser(res.data.data);
        return { success: true };
      }
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Failed to update profile' };
    }
  };

  // Logout
  const logout = () => {
    setToken('');
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    error,
    register,
    login,
    logout,
    updateProfile,
    setError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
