import React, { createContext, useState, useEffect } from 'react';
import { login as loginAPI, register as registerAPI, updateUserAvatar } from '../services/api';
import { setCookie, getCookie, deleteCookie } from '../utils/cookieUtils';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const storedToken = getCookie('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    } else {
      // If token is missing (expired/cleared), clean up user data
      localStorage.removeItem('user');
    }
    setLoading(false);
  }, []);

  const login = async (email, password, rememberMe = false) => {
    const response = await loginAPI({ email, password });
    const { token, user } = response.data;

    // Store token in cookie (Persistent if rememberMe is true, Session otherwise)
    setCookie('token', token, rememberMe ? 30 : null);

    // Store user info in localStorage (for quick access, insensitive data)
    localStorage.setItem('user', JSON.stringify(user));

    setToken(token);
    setUser(user);

    return response.data;
  };

  const register = async (userData) => {
    const response = await registerAPI(userData);
    const { token, user } = response.data;

    // Default to session cookie for new registration
    setCookie('token', token, null);
    localStorage.setItem('user', JSON.stringify(user));

    setToken(token);
    setUser(user);

    return response.data;
  };

  const updateAvatar = async (avatar) => {
    const response = await updateUserAvatar(avatar);
    const updatedUser = response.data.user;

    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);

    return response.data;
  };

  const logout = () => {
    deleteCookie('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, updateAvatar, loading }}>
      {children}
    </AuthContext.Provider>
  );
};