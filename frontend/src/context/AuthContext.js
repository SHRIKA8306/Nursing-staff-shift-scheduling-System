import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('nurse_sync_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState(() => localStorage.getItem('nurse_sync_token') || null);
  const [role, setRole] = useState(() => localStorage.getItem('nurse_sync_role') || null);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (token) {
      localStorage.setItem('nurse_sync_token', token);
      fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setUnreadCount(data.filter(n => !n.read).length);
        }
      })
      .catch(err => console.error(err));
    } else {
      localStorage.removeItem('nurse_sync_token');
      setUnreadCount(0);
    }

    if (user) {
      localStorage.setItem('nurse_sync_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('nurse_sync_user');
    }

    if (role) {
      localStorage.setItem('nurse_sync_role', role);
    } else {
      localStorage.removeItem('nurse_sync_role');
    }
  }, [token, user, role]);

  const loginAdmin = async (email, password) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      setLoading(false);

      if (!response.ok) {
        throw new Error(data.message || 'Admin authentication failed');
      }

      setUser(data.user);
      setToken(data.token);
      setRole('admin');
      return data;
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const loginNurse = async (username, password) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/nurse-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      setLoading(false);

      if (!response.ok) {
        throw new Error(data.message || 'Nurse authentication failed');
      }

      setUser(data.user);
      setToken(data.token);
      setRole('nurse');
      return data;
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const setAuthSession = (userData, userToken, userRole) => {
    setUser(userData);
    setToken(userToken);
    setRole(userRole);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setRole(null);
    localStorage.removeItem('nurse_sync_user');
    localStorage.removeItem('nurse_sync_token');
    localStorage.removeItem('nurse_sync_role');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        loading,
        loginAdmin,
        loginNurse,
        setAuthSession,
        logout,
        unreadCount,
        setUnreadCount,
        isAuthenticated: !!token && !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
