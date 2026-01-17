import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { AuthContext } from '../context/AuthContext';
// Auth screens
import RegisterScreen from '../screens/auth/RegisterScreen';
import OTPVerificationScreen from '../screens/auth/OTPVerificationScreen';
import NewLoginScreen from '../screens/auth/NewLoginScreen';
// Admin screens
import AdminClientsScreen from '../screens/admin/ClientsScreen';
import AdminClientProjectsScreen from '../screens/admin/ClientProjectsScreen';
import AdminProfileScreen from '../screens/admin/ProfileScreen';
import AddClientScreen from '../screens/admin/AddClientScreen';
import AddProjectScreen from '../screens/admin/AddProjectScreen';
import AddEmployeeScreen from '../screens/admin/AddEmployeeScreen';
// Manager screens
import ManagerClientsScreen from '../screens/manager/ClientsScreen';
import ManagerClientProjectsScreen from '../screens/manager/ClientProjectsScreen';
import ManagerProfileScreen from '../screens/manager/ProfileScreen';
// Employee screens
import EmployeeClientProjectsScreen from '../screens/employee/ClientProjectsScreen';
import EmployeeProfileScreen from '../screens/employee/ProfileScreen';
// Onboarding screens
import OnboardingChoiceScreen from '../screens/onboarding/OnboardingChoiceScreen';
import RegisterOrganizationScreen from '../screens/onboarding/RegisterOrganizationScreen';
import OrganizationQRCodeScreen from '../screens/onboarding/OrganizationQRCodeScreen';
import ScanOrganizationScreen from '../screens/onboarding/ScanOrganizationScreen';

// Proof of Work screens
import ProofOfWorkCaptureScreen from '../screens/proofOfWork/ProofOfWorkCaptureScreen';

// Admin screens
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminTimeTrackingScreen from '../screens/admin/AdminTimeTrackingScreen';
import AdminProjectsScreen from '../screens/admin/ProjectsScreen';
import AdminProjectDetailsScreen from '../screens/admin/AdminProjectDetailsScreen';
import AdminPermissionsScreen from '../screens/admin/AdminPermissionsScreen';
import AdminEmployeeInfoScreen from '../screens/admin/EmployeeInfoScreen';

// Manager screens
import ManagerDashboardScreen from '../screens/manager/ManagerDashboardScreen';
import ManagerTimeTrackingScreen from '../screens/manager/ManagerTimeTrackingScreen';
import ManagerProjectsScreen from '../screens/manager/ProjectsScreen';
import ManagerProjectDetailsScreen from '../screens/manager/ManagerProjectDetailsScreen';
import ManagerEmployeeDetailScreen from '../screens/manager/EmployeeDetailScreen';
import AdminEmployeeDetailScreen from '../screens/admin/EmployeeDetailScreen';
import EmployeeTimeTrackingScreen from '../screens/manager/EmployeeTimeTrackingScreen';
import EmployeeProjectTimeScreen from '../screens/manager/EmployeeProjectTimeScreen';
import ManagerEmployeesScreen from '../screens/manager/EmployeesScreen';
import AdminEmployeesScreen from '../screens/admin/EmployeesScreen';
import OverdueTasksScreen from '../screens/manager/OverdueTasksScreen';
import AllTasksScreen from '../screens/manager/AllTasksScreen';
import ProjectTasksScreen from '../screens/manager/ProjectTasksScreen';
import AdminProjectTasksScreen from '../screens/admin/ProjectTasksScreen';
import TaskViewScreen from '../screens/manager/TaskViewScreen';

// Employee screens
import EmployeeDashboardScreen from '../screens/employee/EmployeeDashboardScreen';
import EmployeeProjectsScreen from '../screens/employee/ProjectsScreen';
import EmployeeProjectDetailsScreen from '../screens/employee/ProjectDetailsScreen';
import EmployeeAllTasksScreen from '../screens/employee/EmployeeAllTasksScreen';
import TimeEntryScreen from '../screens/employee/TimeEntryScreen';
import TimeEntriesScreen from '../screens/employee/TimeEntriesScreen';
import TimeTrackingScreen from '../screens/employee/TimeTrackingScreen';
import TaskUploadScreen from '../screens/employee/TaskUploadScreen';
import CreateTaskScreen from '../screens/employee/CreateTaskScreen';
import MyUploadsScreen from '../screens/employee/MyUploadsScreen';
import TaskDetailsScreen from '../screens/employee/TaskDetailsScreen';
import AllAttachmentsScreen from '../screens/employee/AllAttachmentsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const EmployeesTab = createBottomTabNavigator();

// Admin Employees Tab Navigator with 4 tabs: Dashboard, Add, Expense, Notifications
function AdminEmployeesTabNavigator() {
  return (
    <EmployeesTab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#877ED2',
        tabBarInactiveTintColor: '#666',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '400',
          marginTop: 2,
        },
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e1e5e9',
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        headerShown: false,
      }}
    >
      <EmployeesTab.Screen
        name="EmployeeList"
        component={AdminEmployeesScreen}
        options={{
          tabBarLabel: 'Employee',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? 'list' : 'list-outline'}
              size={size || 24}
              color={color}
            />
          ),
        }}
      />
      <EmployeesTab.Screen
        name="Add"
        component={AddEmployeeScreen}
        options={{
          tabBarLabel: 'Add',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? 'add-circle' : 'add-circle-outline'}
              size={size || 24}
              color={color}
            />
          ),
        }}
      />
      <EmployeesTab.Screen
        name="Expense"
        component={AdminTimeTrackingScreen}
        options={{
          tabBarLabel: 'Expense',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? 'stats-chart' : 'stats-chart-outline'}
              size={size || 24}
              color={color}
            />
          ),
        }}
      />
      <EmployeesTab.Screen
        name="Notifications"
        component={AdminPermissionsScreen}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
          },
        }}
        options={{
          tabBarLabel: 'Notifications',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? 'notifications' : 'notifications-outline'}
              size={size || 24}
              color={color}
            />
          ),
        }}
      />
    </EmployeesTab.Navigator>
  );
}

function AppTabs() {
  const { user, loading } = useContext(AuthContext);
  
  // Show loading or fallback if user is not loaded
  if (loading || !user) {
    // Return a simple loading screen or default to manager view
    const DefaultComponent = ManagerDashboardScreen;
    return (
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopWidth: 1,
            borderTopColor: '#e1e5e9',
            paddingBottom: 8,
            paddingTop: 8,
            height: 60,
          },
        }}
      >
        <Tab.Screen 
          name="Home" 
          component={DefaultComponent}
          options={{
            tabBarIcon: ({ color, focused, size }) => (
              <Ionicons 
                name={focused ? 'home' : 'home-outline'} 
                size={size || 24} 
                color={color} 
              />
            ),
          }}
        />
      </Tab.Navigator>
    );
  }

  // Safe role detection - using direct user role without context
  const userRole = user?.role || 'employee';
  const isEmployee = userRole === 'employee';
  const isManager = userRole === 'manager';
  const isAdmin = userRole === 'admin';
  
  console.log('Role detection:', { userRole, isEmployee, isManager, isAdmin });

  // Custom styling for employee bottom navigation - exact match to design
  const employeeTabBarStyle = {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
    paddingTop: 6,
    height: Platform.OS === 'ios' ? 70 : 60,
    elevation: 0, // Remove shadow on Android
    shadowOpacity: 0, // Remove shadow on iOS
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  };

  // Default styling for managers/admins
  const defaultTabBarStyle = {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
    paddingBottom: 8,
    paddingTop: 8,
    height: 60,
  };

  // Admin role - bottom tabs only visible on Dashboard
  if (isAdmin) {
    return (
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#877ED2',
          tabBarInactiveTintColor: '#666',
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '400',
            marginTop: 2,
          },
          tabBarItemStyle: {
            flex: 1,
          },
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopWidth: 1,
            borderTopColor: '#e1e5e9',
            paddingBottom: 8,
            paddingTop: 8,
            height: 60,
            justifyContent: 'space-around',
          },
          headerShown: false,
        }}
      >
        <Tab.Screen 
          name="Home" 
          component={AdminDashboardScreen}
          options={{
            tabBarLabel: 'Dashboard',
            tabBarIcon: ({ color, focused, size }) => (
              <Ionicons 
                name={focused ? 'grid' : 'grid-outline'} 
                size={size || 24} 
                color={color} 
              />
            ),
          }}
        />
        <Tab.Screen 
          name="Tasks" 
          component={AdminDashboardScreen}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
            },
          }}
          options={{
            tabBarLabel: 'Task',
            tabBarIcon: ({ color, focused, size }) => (
              <Ionicons 
                name={focused ? 'clipboard' : 'clipboard-outline'} 
                size={size || 24} 
                color={color} 
              />
            ),
          }}
        />
        <Tab.Screen 
          name="AdminProjects" 
          component={AdminProjectsScreen}
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              e.preventDefault();
              navigation.navigate('Projects');
            },
          })}
          options={{
            tabBarLabel: 'Projects',
            tabBarIcon: ({ color, focused, size }) => (
              <Ionicons 
                name={focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'} 
                size={size || 24} 
                color={color} 
              />
            ),
          }}
        />
        <Tab.Screen 
          name="AdminTimeEntries" 
          component={AdminTimeTrackingScreen}
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              e.preventDefault();
              navigation.navigate('TimeEntries');
            },
          })}
          options={{
            tabBarLabel: 'Expense',
            tabBarIcon: ({ color, focused, size }) => (
              <Ionicons 
                name={focused ? 'stats-chart' : 'stats-chart-outline'} 
                size={size || 24} 
                color={color} 
              />
            ),
          }}
        />
        <Tab.Screen 
          name="Notifications" 
          component={AdminDashboardScreen}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
            },
          }}
          options={{
            tabBarLabel: 'Notifications',
            tabBarIcon: ({ color, focused, size }) => (
              <Ionicons 
                name={focused ? 'notifications' : 'notifications-outline'} 
                size={size || 24} 
                color={color} 
              />
            ),
          }}
        />
      </Tab.Navigator>
    );
  }

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: isEmployee ? '#6C63FF' : '#007AFF',
        tabBarInactiveTintColor: isEmployee ? '#9CA3AF' : '#666',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '400',
          marginTop: 2,
          marginBottom: 0,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
        tabBarItemStyle: {
          paddingVertical: 0,
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarStyle: isEmployee ? employeeTabBarStyle : defaultTabBarStyle,
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={isEmployee ? EmployeeDashboardScreen : ManagerDashboardScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused, size }) => {
            if (isEmployee) {
              return (
                <Ionicons 
                  name="home-outline" 
                  size={24} 
                  color={color} 
                />
              );
            }
            return (
              <Ionicons 
                name={focused ? 'home' : 'home-outline'} 
                size={size || 24} 
                color={color} 
              />
            );
          },
        }}
      />
      <Tab.Screen 
        name="Projects" 
        component={isEmployee ? EmployeeAllTasksScreen : ManagerProjectsScreen}
        options={{
          tabBarLabel: isEmployee ? 'Task' : 'Projects',
          tabBarIcon: ({ color, focused, size }) => {
            if (isEmployee) {
              return (
                <Ionicons 
                  name="clipboard" 
                  size={24} 
                  color={color} 
                />
              );
            }
            return (
              <Ionicons 
                name={focused ? 'folder' : 'folder-outline'} 
                size={size || 24} 
                color={color} 
              />
            );
          },
        }}
      />
      <Tab.Screen 
        name="TimeEntries" 
        component={isEmployee ? EmployeeTimeTrackingScreen : ManagerTimeTrackingScreen} 
        options={{ 
          title: 'Reports',
          tabBarLabel: 'Reports',
          tabBarIcon: ({ color, focused, size }) => {
            if (isEmployee) {
              return (
                <Ionicons 
                  name="bar-chart-outline" 
                  size={24} 
                  color={color} 
                />
              );
            }
            return (
              <Ionicons 
                name={focused ? 'bar-chart' : 'bar-chart-outline'} 
                size={size || 24} 
                color={color} 
              />
            );
          },
        }} 
      />
      {/* Manager tabs - only show for managers */}
      {isManager && (
        <>
          <Tab.Screen 
            name="Employees" 
            component={ManagerEmployeesScreen}
            options={{
              tabBarIcon: ({ color, focused, size }) => (
                <Ionicons 
                  name={focused ? 'people' : 'people-outline'} 
                  size={size || 24} 
                  color={color} 
                />
              ),
            }}
          />
          <Tab.Screen 
            name="Clients" 
            component={ManagerClientsScreen}
            options={{
              tabBarIcon: ({ color, focused, size }) => (
                <Ionicons 
                  name={focused ? 'business' : 'business-outline'} 
                  size={size || 24} 
                  color={color} 
                />
              ),
            }}
          />
        </>
      )}
      <Tab.Screen 
        name="Profile" 
        component={isEmployee ? EmployeeProfileScreen : ManagerProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused, size }) => {
            if (isEmployee) {
              return (
                <Ionicons 
                  name="person-outline" 
                  size={24} 
                  color={color} 
                />
              );
            }
            return (
              <Ionicons 
                name={focused ? 'person' : 'person-outline'} 
                size={size || 24} 
                color={color} 
              />
            );
          },
        }}
      />
    </Tab.Navigator>
  );
}

// Wrapper for ClientProjectsScreen to dynamically select based on role
function ClientProjectsScreenWrapper(props: any) {
  const { user } = useContext(AuthContext);
  const userRole = user?.role || 'employee';
  
  if (userRole === 'admin') {
    return <AdminClientProjectsScreen {...props} />;
  } else if (userRole === 'manager') {
    return <ManagerClientProjectsScreen {...props} />;
  } else {
    return <EmployeeClientProjectsScreen {...props} />;
  }
}

// Wrapper for ProjectDetailsScreen to dynamically select based on role
// Note: Employees should use EmployeeProjectDetails route instead (not this wrapper)
function ProjectDetailsScreenWrapper(props: any) {
  const { user } = useContext(AuthContext);
  const userRole = user?.role || 'employee';
  
  if (userRole === 'admin') {
    return <AdminProjectDetailsScreen {...props} />;
  } else if (userRole === 'manager') {
    return <ManagerProjectDetailsScreen {...props} />;
  } else {
    // Employees should not use ProjectDetails route - they should use EmployeeProjectDetails
    // Return null as employees have their own dedicated route
    return null;
  }
}

// Wrapper for ProjectTasksScreen to dynamically select based on role
function ProjectTasksScreenWrapper(props: any) {
  const { user } = useContext(AuthContext);
  const userRole = user?.role || 'employee';
  
  if (userRole === 'admin') {
    return <AdminProjectTasksScreen {...props} />;
  } else {
    return <ProjectTasksScreen {...props} />;
  }
}

// Wrapper for EmployeeDetailScreen to dynamically select based on role
function EmployeeDetailScreenWrapper(props: any) {
  const { user } = useContext(AuthContext);
  const userRole = user?.role || 'employee';
  
  if (userRole === 'admin') {
    return <AdminEmployeeDetailScreen {...props} />;
  } else {
    return <ManagerEmployeeDetailScreen {...props} />;
  }
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={NewLoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} options={{ headerShown: true, title: 'Verify Phone' }} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { token, loading } = useContext(AuthContext);

  // While loading auth state, don't render any screen to prevent flash
  if (loading) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token ? (
          <>
            <Stack.Screen name="App" component={AppTabs} />
            <Stack.Screen name="ProjectDetails" component={ProjectDetailsScreenWrapper} options={{ headerShown: false }} />
            <Stack.Screen name="EmployeeProjectDetails" component={EmployeeProjectDetailsScreen} options={{ headerShown: false }} />
            <Stack.Screen name="EmployeeProjects" component={EmployeeProjectsScreen} options={{ headerShown: false }} />
            <Stack.Screen name="EmployeeProjectTime" component={EmployeeProjectTimeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ClientProjects" component={ClientProjectsScreenWrapper} options={{ headerShown: true, title: 'Client Projects' }} />
            <Stack.Screen name="EmployeeDetail" component={EmployeeDetailScreenWrapper} options={{ headerShown: true, title: 'Employee Details' }} />
            <Stack.Screen name="TimeEntry" component={TimeEntryScreen} options={{ headerShown: true, title: 'Manual Time Entry' }} />
            <Stack.Screen name="Timesheet" component={TimeEntriesScreen} options={{ headerShown: true, title: 'Timesheet' }} />
            <Stack.Screen name="TaskUpload" component={TaskUploadScreen} options={{ headerShown: true, title: 'Upload Completed Task' }} />
            <Stack.Screen name="CreateTask" component={CreateTaskScreen} options={{ headerShown: false }} />
            <Stack.Screen name="MyUploads" component={MyUploadsScreen} options={{ headerShown: true, title: 'My Uploads' }} />
            <Stack.Screen name="TaskDetails" component={TaskDetailsScreen} options={{ headerShown: false }} />
            <Stack.Screen name="AllAttachmentsScreen" component={AllAttachmentsScreen} options={{ headerShown: false }} />
            <Stack.Screen name="EmployeeAllTasks" component={EmployeeAllTasksScreen} options={{ headerShown: false }} />
            <Stack.Screen name="OverdueTasks" component={OverdueTasksScreen} options={{ headerShown: true, title: 'Overdue Tasks' }} />
            <Stack.Screen name="AllTasks" component={AllTasksScreen} options={{ headerShown: true, title: 'All Tasks' }} />
            <Stack.Screen name="ProjectTasks" component={ProjectTasksScreenWrapper} options={{ headerShown: true, title: 'Project Tasks' }} />
            <Stack.Screen name="TaskView" component={TaskViewScreen} options={{ headerShown: false }} />
            <Stack.Screen name="AddClient" component={AddClientScreen} options={{ headerShown: true, title: 'Add Client' }} />
            <Stack.Screen name="AddProject" component={AddProjectScreen} options={{ headerShown: true, title: 'Create Project' }} />
            <Stack.Screen name="AddEmployee" component={AddEmployeeScreen} options={{ headerShown: false }} />
            {/* Admin screens without bottom tabs */}
            <Stack.Screen name="Clients" component={AdminClientsScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Projects" component={AdminProjectsScreen} options={{ headerShown: false }} />
            <Stack.Screen name="TimeEntries" component={AdminTimeTrackingScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Employees" component={AdminEmployeesTabNavigator} options={{ headerShown: false }} />
            <Stack.Screen name="EmployeeInfo" component={AdminEmployeeInfoScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Permissions" component={AdminPermissionsScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Profile" component={AdminProfileScreen} options={{ headerShown: false }} />
            {/* Proof of Work */}
            <Stack.Screen name="ProofOfWorkCapture" component={ProofOfWorkCaptureScreen} options={{ headerShown: true, title: 'Proof of Work' }} />
          </>
        ) : (
          // Show onboarding first, then login
          <>
            <Stack.Screen name="Onboarding" component={OnboardingChoiceScreen} />
            <Stack.Screen name="Auth" component={AuthStack} />
            {/* Onboarding routes */}
            <Stack.Screen name="RegisterOrganization" component={RegisterOrganizationScreen} options={{ headerShown: false }} />
            <Stack.Screen name="OrganizationQRCode" component={OrganizationQRCodeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ScanOrganization" component={ScanOrganizationScreen} options={{ headerShown: false }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
