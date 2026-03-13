import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getPermissionsMatrix, PermissionMatrixRow } from '../api/endpoints';
import { AuthContext } from './AuthContext';

type Role = 'admin' | 'manager' | 'employee';

type PermissionsContextValue = {
  loaded: boolean;
  has: (permissionId: string) => boolean;
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

// Whitelist only actual, implemented permissions in the app
const KNOWN_PERMISSION_IDS = new Set<string>([
  // Client permissions
  'clients.view',
  'clients.add',
  'clients.edit',
  'clients.delete',
  
  // Project permissions
  'projects.view',
  'projects.add',
  'projects.edit',
  'projects.delete',
  
  // Task permissions
  'tasks.view',
  'tasks.add',
  'tasks.edit',
  'tasks.delete',
  'tasks.priority',
  
  // Employee permissions
  'employees.view',
  'employees.add',
  'employees.edit',
  'employees.delete',
  
  // Attachments permissions
  'attachments.view',
  'attachments.add',
  'attachments.edit',
  'attachments.delete',
  
  // Expenses permissions
  'expenses.view',
  'expenses.approve',
  
  // Attendance permissions
  'attendance.view',
  'attendance.approve',
]);

export const PermissionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useContext(AuthContext);
  const [matrix, setMatrix] = useState<PermissionMatrixRow[] | null>(null);
  const [loaded, setLoaded] = useState(false);

  const load = async () => {
    try {
      setLoaded(false);
      // If no token (offline or not logged in), don't call API – use empty permissions
      if (!token) {
        console.log('🔒 PermissionsContext: No token, using empty permissions');
        setMatrix([]);
        return;
      }
      console.log('🔄 PermissionsContext: Loading permissions from API...');
      const res = await getPermissionsMatrix();
      const rows = (res as any)?.permissions as PermissionMatrixRow[];
      console.log('✅ PermissionsContext: Loaded', rows?.length || 0, 'permissions:', rows);
      setMatrix(Array.isArray(rows) ? rows : []);
    } catch (e) {
      console.warn('❌ PermissionsContext: Load failed, defaulting to empty:', (e as any)?.message);
      setMatrix([]);
    } finally {
      setLoaded(true);
    }
  };

  // Load when token becomes available; otherwise default to empty and mark loaded
  useEffect(() => {
    if (token) {
      load();
    } else {
      setMatrix([]);
      setLoaded(true);
    }
  }, [token]);

  const permissionsForRole = useMemo(() => {
    const role = (user?.role || 'employee') as Role;
    const map: Record<string, boolean> = {};
    if (!matrix) return map;
    for (const row of matrix) {
      // Use row.name (e.g., 'clients.add') instead of row.id (UUID)
      const permName = row.name || row.id;
      if (!KNOWN_PERMISSION_IDS.has(permName)) continue; // filter out dummy/unknown permissions
      const access = (row as any).access?.[role];
      map[permName] = !!access;
    }
    // Admins have all permissions by default
    if (role === 'admin') {
      for (const id of KNOWN_PERMISSION_IDS) map[id] = true;
    }
    console.log(`🔐 PermissionsContext: Permissions for ${role}:`, map);
    return map;
  }, [matrix, user?.role]);

  const has = (permissionId: string) => {
    const role = (user?.role || 'employee') as Role;
    if (role === 'admin') return true;
    const hasPermission = !!permissionsForRole[permissionId];
    console.log(`🔍 PermissionsContext: Checking ${permissionId} for ${role}: ${hasPermission}`);
    return hasPermission;
  };

  const value = useMemo<PermissionsContextValue>(() => ({
    loaded,
    has,
    permissionsForRole,
    refresh: load,
  }), [loaded, permissionsForRole, token]);

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = () => useContext(PermissionsContext);
