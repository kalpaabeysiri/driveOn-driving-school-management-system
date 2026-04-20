import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token    = await SecureStore.getItemAsync('token');
        const userType = await SecureStore.getItemAsync('userType');
        const userId   = await SecureStore.getItemAsync('userId');
        if (token && userType && userId) {
          let endpoint = '/auth/profile';
          if (userType === 'student')    endpoint = `/students/${userId}`;
          if (userType === 'instructor') endpoint = `/instructors/${userId}`;
          try {
            const { data } = await api.get(endpoint);
            setUser({ ...data, role: userType });
          } catch (error) {
            // Only clear credentials on auth errors (401/403), not network errors
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
              await SecureStore.deleteItemAsync('token');
              await SecureStore.deleteItemAsync('userType');
              await SecureStore.deleteItemAsync('userId');
            }
            // On network error: leave credentials intact, user stays on login screen
          }
        }
      } catch {
        // SecureStore read failure — clear all
        await SecureStore.deleteItemAsync('token');
        await SecureStore.deleteItemAsync('userType');
        await SecureStore.deleteItemAsync('userId');
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = async (email, password) => {
    setSigning(true);
    let data = null;
    let role = null;
    let lastError = null;

    try {
      const res = await api.post('/auth/login', { email, password });
      data = res.data;
      role = data.role || 'admin';
    } catch (error) {
      lastError = error;
    }

    if (!data) {
      try {
        const res = await api.post('/students/login', { email, password });
        data = res.data;
        role = 'student';
      } catch (error) {
        lastError = error;
      }
    }

    if (!data) {
      try {
        const res = await api.post('/instructors/login', { email, password });
        data = res.data;
        role = 'instructor';
      } catch (error) {
        lastError = error;
      }
    }

    if (!data) {
      setSigning(false);
      // Distinguish network errors from credential errors
      const isNetworkError = !lastError?.response;
      throw new Error(
        isNetworkError
          ? 'Cannot connect to server. Make sure the backend is running and the IP address in api.js is correct.'
          : 'Invalid email or password'
      );
    }

    await SecureStore.setItemAsync('token',    data.token);
    await SecureStore.setItemAsync('userType', role);
    await SecureStore.setItemAsync('userId',   String(data._id));

    const userData = { ...data, role };
    setUser(userData);
    // Add a small delay for smooth transition
    setTimeout(() => setSigning(false), 500);
    return userData;
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('userType');
    await SecureStore.deleteItemAsync('userId');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signing, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
