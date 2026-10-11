import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('nyayadrishti_token');
  });

  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('nyayadrishti_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Validate or restore user session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem('nyayadrishti_token');
      if (storedToken) {
        try {
          const res = await api.getMe();
          setUser(res.user);
          localStorage.setItem('nyayadrishti_user', JSON.stringify(res.user));
        } catch (err) {
          console.warn('[AuthContext] Session expired or invalid, clearing local session.');
          localStorage.removeItem('nyayadrishti_token');
          localStorage.removeItem('nyayadrishti_user');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    restoreSession();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('nyayadrishti_token', res.token);
    localStorage.setItem('nyayadrishti_user', JSON.stringify(res.user));
  };

  const register = async (name: string, email: string, password: string, role?: string) => {
    const res = await api.register(name, email, password, role);
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('nyayadrishti_token', res.token);
    localStorage.setItem('nyayadrishti_user', JSON.stringify(res.user));
  };

  const logout = async () => {
    await api.logout();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
