import React, { createContext, useContext, useMemo } from 'react';
import { AuthContext } from './AuthContext';

type RoleContextValue = {
  isAdmin: boolean;
  isManager: boolean;
  isEmployee: boolean;
  role: 'admin' | 'manager' | 'employee' | null;
  canManageEmployees: boolean;
  canManageClients: boolean;
  canViewAllProjects: boolean;
  canViewAllTimeEntries: boolean;
  canCreateProjects: boolean;
  canAssignTasks: boolean;
  canManageUsers: boolean;
  canViewSystemSettings: boolean;
};

export const RoleContext = createContext<RoleContextValue>({
  isAdmin: false,
  isManager: false,
  isEmployee: false,
  role: null,
  canManageEmployees: false,
  canManageClients: false,
  canViewAllProjects: false,
  canViewAllTimeEntries: false,
  canCreateProjects: false,
  canAssignTasks: false,
  canManageUsers: false,
  canViewSystemSettings: false,
});

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const authContext = useContext(AuthContext);
  const user = authContext?.user;

  const roleContextValue = useMemo<RoleContextValue>(() => {
    try {
      const role = user?.role || null;
      const isAdmin = role === 'admin';
      const isManager = role === 'manager';
      const isEmployee = role === 'employee';

      const contextValue: RoleContextValue = {
        isAdmin,
        isManager,
        isEmployee,
        role,
        canManageEmployees: isAdmin || isManager,
        canManageClients: isAdmin,
        canViewAllProjects: isAdmin || isManager,
        canViewAllTimeEntries: isAdmin || isManager,
        canCreateProjects: isAdmin || isManager,
        canAssignTasks: isAdmin || isManager,
        canManageUsers: isAdmin,
        canViewSystemSettings: isAdmin,
      };

      console.log('RoleContext value created:', contextValue);
      return contextValue;
    } catch (error) {
      console.error('Error creating role context value:', error);
      // Return safe defaults
      return {
        isAdmin: false,
        isManager: false,
        isEmployee: true,
        role: 'employee',
        canManageEmployees: false,
        canManageClients: false,
        canViewAllProjects: false,
        canViewAllTimeEntries: false,
        canCreateProjects: false,
        canAssignTasks: false,
        canManageUsers: false,
        canViewSystemSettings: false,
      };
    }
  }, [user?.role]);

  return (
    <RoleContext.Provider value={roleContextValue}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    console.warn('useRole called outside RoleProvider, returning default values');
    return {
      isAdmin: false,
      isManager: false,
      isEmployee: true,
      role: 'employee',
      canManageEmployees: false,
      canManageClients: false,
      canViewAllProjects: false,
      canViewAllTimeEntries: false,
      canCreateProjects: false,
      canAssignTasks: false,
      canManageUsers: false,
      canViewSystemSettings: false,
    };
  }
  return context;
};
