# Role-Based Architecture Documentation

## Overview

This project implements a comprehensive role-based separation between Manager and Employee users. The architecture ensures that each role has access to appropriate features and screens based on their permissions.

## Architecture Components

### 1. Role Context (`src/context/RoleContext.tsx`)

A centralized context provider that manages role-based permissions and state:

```typescript
type RoleContextValue = {
  isManager: boolean;
  isEmployee: boolean;
  role: 'manager' | 'employee' | null;
  canManageEmployees: boolean;
  canManageClients: boolean;
  canViewAllProjects: boolean;
  canViewAllTimeEntries: boolean;
  canCreateProjects: boolean;
  canAssignTasks: boolean;
};
```

### 2. Separate Screen Components

#### Manager Screens
- **ManagerDashboardScreen** (`src/screens/ManagerDashboardScreen.tsx`)
  - Project management overview
  - Team performance metrics
  - Client relationship management
  - High-level project status

- **ManagerTimeTrackingScreen** (`src/screens/ManagerTimeTrackingScreen.tsx`)
  - Team time tracking overview
  - Active employees monitoring
  - Project performance analysis
  - Time allocation insights

#### Employee Screens
- **EmployeeDashboardScreen** (`src/screens/EmployeeDashboardScreen.tsx`)
  - Personal task management
  - Assigned projects overview
  - Weekly performance tracking
  - Task status updates

- **EmployeeTimeTrackingScreen** (`src/screens/EmployeeTimeTrackingScreen.tsx`)
  - Personal time tracking
  - Timer functionality
  - Manual time entry
  - Project-specific time logging

### 3. Role-Based Navigation

The navigation system automatically switches between role-specific screens:

```typescript
// Dashboard tab shows different screens based on role
<Tab.Screen 
  name="Dashboard" 
  component={isEmployee ? EmployeeDashboardScreen : ManagerDashboardScreen}
/>

// Time tracking tab shows different screens based on role
<Tab.Screen 
  name="TimeEntries" 
  component={isEmployee ? EmployeeTimeTrackingScreen : ManagerTimeTrackingScreen} 
/>
```

### 4. Manager-Only Features

Managers have access to additional tabs and functionality:
- **Employees Tab**: Manage team members
- **Clients Tab**: Manage client relationships
- **Project Management**: Create and assign projects
- **Team Monitoring**: View all team time entries
- **Performance Analytics**: Team-wide metrics

### 5. Employee-Only Features

Employees have focused functionality:
- **Personal Tasks**: View and update assigned tasks
- **Time Tracking**: Start/stop timers for projects
- **Project Progress**: View assigned project details
- **Personal Analytics**: Individual performance metrics

## Key Features by Role

### Manager Features
- ✅ View all projects and their status
- ✅ Monitor team time tracking in real-time
- ✅ Manage employee assignments
- ✅ Track client relationships
- ✅ Create and assign new projects
- ✅ View team performance analytics
- ✅ Approve time entries
- ✅ Generate reports

### Employee Features
- ✅ View assigned projects only
- ✅ Track personal time with timers
- ✅ Update task status
- ✅ Log manual time entries
- ✅ View personal performance metrics
- ✅ Access project details for assigned projects

## Implementation Details

### 1. Authentication Flow
The authentication system determines user role during login:
```typescript
// In AuthContext
const login = async (email: string, password: string) => {
  const res = await loginApi({ email, password });
  setUser(res.user as AuthUser); // Includes role: 'manager' | 'employee'
};
```

### 2. Permission-Based Rendering
Components use the RoleContext to conditionally render features:
```typescript
const { canManageEmployees, canViewAllProjects } = useRole();

return (
  <View>
    {canManageEmployees && <EmployeeManagementSection />}
    {canViewAllProjects && <AllProjectsView />}
  </View>
);
```

### 3. Data Access Control
Data selectors are role-aware:
```typescript
// Employee sees only assigned projects
const userProjects = getAssignedProjectsForUser(user.id);

// Manager sees all projects
const allProjects = getAllProjects();
```

## Security Considerations

1. **Frontend Validation**: Role-based UI components prevent unauthorized access
2. **Backend Authorization**: Server-side role validation (implemented in middleware)
3. **Data Filtering**: API responses filtered based on user role
4. **Route Protection**: Navigation guards prevent access to unauthorized screens

## Usage Examples

### Checking User Role
```typescript
import { useRole } from '../context/RoleContext';

function MyComponent() {
  const { isManager, isEmployee, canManageEmployees } = useRole();
  
  if (isManager) {
    return <ManagerView />;
  }
  
  if (isEmployee) {
    return <EmployeeView />;
  }
  
  return <LoadingView />;
}
```

### Conditional Feature Rendering
```typescript
function ProjectScreen() {
  const { canCreateProjects, canAssignTasks } = useRole();
  
  return (
    <View>
      <ProjectList />
      {canCreateProjects && <CreateProjectButton />}
      {canAssignTasks && <AssignTaskButton />}
    </View>
  );
}
```

## Benefits of This Architecture

1. **Clear Separation**: Distinct screens and functionality for each role
2. **Maintainability**: Easy to add new role-specific features
3. **Security**: Role-based access control at multiple levels
4. **User Experience**: Tailored interfaces for each user type
5. **Scalability**: Easy to add new roles or modify permissions
6. **Code Organization**: Clean separation of concerns

## Future Enhancements

1. **Additional Roles**: Support for additional specialized roles if needed
2. **Granular Permissions**: More specific permission controls
3. **Role Switching**: Allow users to switch between roles
4. **Custom Dashboards**: User-configurable dashboard layouts
5. **Audit Logging**: Track role-based actions for compliance

## Testing

The role-based architecture can be tested by:
1. Logging in with different user roles
2. Verifying appropriate screens are shown
3. Testing permission-based feature access
4. Validating data filtering based on role
5. Ensuring unauthorized access is prevented

This architecture provides a solid foundation for role-based access control while maintaining clean, maintainable code structure.
