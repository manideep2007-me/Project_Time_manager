import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { fetchProfile, login as loginApi, register as registerApi } from '../api/endpoints';
import { setStoredToken, getStoredToken } from '../api/client';
import { User } from '../data/mockData';

type AuthUser = {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  name: string;
  role: 'admin' | 'manager' | 'employee';
  jobTitle?: string;
  salaryMonthly?: number;
  token?: string;
};

// Normalize backend roles to app roles
const normalizeRole = (role: any): 'admin' | 'manager' | 'employee' => {
  const r = String(role || '').toLowerCase();
  if (r === 'admin' || r === 'manager' || r === 'employee') return r as 'admin' | 'manager' | 'employee';
  // Map legacy server roles to app roles (if any)
  // Note: supervisor role has been removed, all users should be admin, manager, or employee
  // Default to employee if unknown
  return 'employee';
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithUser: (user: User) => Promise<void>;
  register: (payload: { email: string; password: string; firstName: string; lastName: string; organizationCode?: string; role?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  loginWithUser: async () => {},
  register: async () => {},
  logout: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const bootstrap = useCallback(async () => {
    setLoading(true);
    try {
      // Disable auto-login - always require manual authentication
      console.log('Auth bootstrap: Auto-login disabled, requiring manual authentication');
      setUser(null);
      setToken(null);
      
      // Clear any stored tokens to prevent auto-login
      await setStoredToken(null);
    } catch (error) {
      console.error('Bootstrap error:', error);
      // Clear everything on any error
      await setStoredToken(null);
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      console.log('Attempting login for:', email);
      const res = await loginApi({ email, password });
      console.log('Login response:', res);
      await setStoredToken(res.token);
      setToken(res.token);
      
      // Map backend user to AuthUser format
      const backendUser = res?.user;
      if (backendUser) {
        const normalized: AuthUser = {
          id: backendUser.id,
          email: backendUser.email,
          firstName: backendUser.first_name || backendUser.firstName,
          lastName: backendUser.last_name || backendUser.lastName,
          name: backendUser.name || `${backendUser.first_name || ''} ${backendUser.last_name || ''}`.trim(),
          role: normalizeRole(backendUser.role),
          jobTitle: backendUser.jobTitle || backendUser.job_title || undefined,
          salaryMonthly: backendUser.salaryMonthly || backendUser.salary_monthly || undefined,
        };
        setUser(normalized);
        console.log('✅ User set:', normalized);
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }, []);

  const loginWithUser = useCallback(async (selectedUser: User) => {
    try {
      console.log('Logging in with user:', selectedUser);
      
      try {
        // Map mock user to real user credentials
        const userCredentialsMap: { [key: string]: { email: string; password: string } } = {
          'user1': { email: 'admin@company.com', password: 'admin123' },
          'user2': { email: 'rajesh@company.com', password: 'manager123' },
          'user3': { email: 'alice@company.com', password: 'employee123' },
          'user4': { email: 'bob@company.com', password: 'employee123' },
          'user5': { email: 'charlie@company.com', password: 'employee123' },
          'user6': { email: 'deepak@company.com', password: 'employee123' },
          'user7': { email: 'sneha@company.com', password: 'employee123' },
          'user8': { email: 'arjun@company.com', password: 'employee123' },
          'user9': { email: 'kavya@company.com', password: 'employee123' },
        };
        
        // Get the real credentials for the selected user
        const credentials = userCredentialsMap[selectedUser.id] || { 
          email: selectedUser.email || 'admin@company.com', 
          password: 'employee123' 
        };
        
        console.log(`🔐 Logging in as: ${credentials.email} (${selectedUser.role})`);
        
        // Use REAL authentication with the selected user's credentials
        const res = await loginApi({ 
          email: credentials.email, 
          password: credentials.password 
        });
        
        console.log('✅ Login response:', res);
        await setStoredToken(res.token);
        setToken(res.token);
        
        // Map backend user to AuthUser format
        const backendUser = res?.user;
        if (backendUser) {
          const normalized: AuthUser = {
            id: backendUser.id,
            email: backendUser.email,
            firstName: backendUser.first_name || backendUser.firstName,
            lastName: backendUser.last_name || backendUser.lastName,
            name: backendUser.name || `${backendUser.first_name || ''} ${backendUser.last_name || ''}`.trim(),
            role: normalizeRole(backendUser.role),
            jobTitle: backendUser.jobTitle || backendUser.job_title || undefined,
            salaryMonthly: backendUser.salaryMonthly || backendUser.salary_monthly || undefined,
          };
          setUser(normalized);
          console.log('✅ User set:', normalized);
        }
      } catch (apiError) {
        console.error('❌ API authentication failed:', (apiError as Error).message);
        throw apiError; // Don't use offline mode - require real authentication
      }
    } catch (error) {
      console.error('User login error:', error);
      throw error;
    }
  }, []);

  const register = useCallback(async (payload: { email: string; password: string; firstName: string; lastName: string; organizationCode?: string; role?: string }) => {
    try {
      console.log('Attempting registration for:', payload.email, 'with org code:', payload.organizationCode);
      const res = await registerApi(payload);
      console.log('Registration response:', res);
      await setStoredToken(res.token);
      setToken(res.token);
      const normalized = res?.user ? { ...res.user, role: normalizeRole(res.user.role) } : null;
      if (normalized) setUser(normalized as AuthUser);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    await setStoredToken(null);
    setToken(null);
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const res = await fetchProfile();
    const normalized = res?.user ? { ...res.user, role: normalizeRole(res.user.role) } : null;
    if (normalized) setUser(normalized as AuthUser);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({ user, token, loading, login, loginWithUser, register, logout, refreshProfile }), [user, token, loading, login, loginWithUser, register, logout, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};


