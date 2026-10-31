import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

const API_BASE = process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace(/\/$/, '') : '';

const parseApiResponse = async (res, fallbackErrMsg) => {
  const contentType = res.headers.get("content-type") || "";
  let data;
  if (contentType.includes("application/json")) {
    try {
      data = await res.json();
    } catch {
      data = { message: fallbackErrMsg };
    }
  } else {
    try {
      const text = await res.text();
      data = { message: text || fallbackErrMsg };
    } catch {
      data = { message: fallbackErrMsg };
    }
  }
  return data;
};

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
      fetch(`${API_BASE}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.ok ? res.json() : [])
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
      const response = await fetch(`${API_BASE}/api/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await parseApiResponse(response, 'Admin authentication failed');
      setLoading(false);

      if (!response.ok) {
        if (response.status === 502 || response.status === 503 || response.status === 504) {
          throw new Error('Backend server is waking up on Render. Please wait 15 seconds and try again.');
        }
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
      const response = await fetch(`${API_BASE}/api/auth/nurse-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await parseApiResponse(response, 'Nurse authentication failed');
      setLoading(false);

      if (!response.ok) {
        if (response.status === 502 || response.status === 503 || response.status === 504) {
          throw new Error('Backend server is waking up on Render. Please wait 15 seconds and try again.');
        }
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
    localStorage.setItem('nurse_sync_user', JSON.stringify(userData));
    localStorage.setItem('nurse_sync_token', userToken);
    localStorage.setItem('nurse_sync_role', userRole);
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
    <AuthContext.Provider value={{
      user,
      token,
      role,
      loading,
      unreadCount,
      setUnreadCount,
      loginAdmin,
      loginNurse,
      setAuthSession,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
