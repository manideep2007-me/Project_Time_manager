import React, { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';
import { getMyPermissions } from '../api/endpoints';
import { AuthContext } from './AuthContext';

type PermissionsContextValue = {
  loaded: boolean;
  has: (permission: string) => boolean;
  permissionsForRole: Record<string, boolean>;
  refresh: () => Promise<void>;
};

const defaultValue: PermissionsContextValue = {
  loaded: false,
  has: () => false,
  permissionsForRole: {},
  refresh: async () => {},
};

export const PermissionsContext = createContext<PermissionsContextValue>(defaultValue);

export const PermissionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useContext(AuthContext);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    if (!token) {
      setPermissions({});
      setLoaded(true);
      return;
    }
    try {
      setLoaded(false);
      const res = await getMyPermissions();
      const map: Record<string, boolean> = {};
      for (const perm of res?.permissions || []) {
        map[perm.name] = !!perm.hasAccess;
      }
      console.log('✅ PermissionsContext: Loaded permissions:', map);
      setPermissions(map);
    } catch (e) {
      console.warn('❌ PermissionsContext: Load failed:', (e as any)?.message);
      setPermissions({});
    } finally {
      setLoaded(true);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const has = useCallback((permission: string) => {
    const role = user?.role;
    if (role === 'admin') return true;
    return permissions[permission] === true;
  }, [permissions, user?.role]);

  const value = useMemo<PermissionsContextValue>(() => ({
    loaded,
    has,
    permissionsForRole: permissions,
    refresh: load,
  }), [loaded, has, permissions, load]);

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = () => useContext(PermissionsContext);
