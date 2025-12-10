// Centralized mock data for development/offline mode
// Types are intentionally simple and broad to satisfy various screen usages

export type User = {
  id: string;
  name: string;
  role: 'admin' | 'manager' | 'employee';
  email?: string;
  phone?: string;
  jobTitle?: string;
  salaryMonthly?: number;
};

export type Project = {
  id: string;
  name: string;
  description?: string;
  status?: 'active' | 'completed' | 'in_progress' | 'on_hold' | 'cancelled' | 'pending' | 'todo';
  startDate?: string; // ISO date
  endDate?: string;   // ISO date
  budget?: number;
  allocated_hours?: number;
  // Relations used by employee screens
  assignedEmployees?: string[]; // user ids
  employees?: string[]; // user ids
};

export type Client = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  contact_person?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  created_at?: string;
  updated_at?: string;
  projects: Project[];
};

export type Task = {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: 'Todo' | 'In Progress' | 'Completed' | 'Blocked';
  priority?: 'Low' | 'Medium' | 'High';
  assignedTo: string; // user id
  dueDate: string; // ISO date
  completedAt?: string; // ISO date
};

export type TimeEntry = {
  id: string;
  employeeId: string;
  projectId: string;
  taskId?: string;
  date: string; // YYYY-MM-DD
  hours: number;
  description?: string;
  isActive?: boolean;
  startTime?: string; // ISO datetime
  endTime?: string;   // ISO datetime
};

export const MOCK_DATA: {
  users: User[];
  clients: Client[];
  tasks: Task[];
  timeEntries: TimeEntry[];
} = {
  users: [
    { id: 'user1', name: 'Admin User', role: 'admin', email: 'admin@company.com', jobTitle: 'System Administrator', salaryMonthly: 150000 },
    { id: 'user2', name: 'Rajesh (Manager)', role: 'manager', email: 'rajesh@company.com', jobTitle: 'Project Manager', salaryMonthly: 120000 },
    { id: 'user3', name: 'Alice Johnson', role: 'employee', email: 'alice@company.com', jobTitle: 'Senior Developer', salaryMonthly: 210000 },
    { id: 'user4', name: 'Bob Williams', role: 'employee', email: 'bob@company.com', jobTitle: 'QA Engineer', salaryMonthly: 165000 },
    { id: 'user5', name: 'Charlie Davis', role: 'employee', email: 'charlie@company.com', jobTitle: 'Frontend Developer', salaryMonthly: 198000 },
    { id: 'user6', name: 'Deepak Kumar', role: 'employee', email: 'deepak@company.com', jobTitle: 'Backend Developer', salaryMonthly: 187000 },
    { id: 'user7', name: 'Sneha Patel', role: 'employee', email: 'sneha@company.com', jobTitle: 'UI/UX Designer', salaryMonthly: 172000 },
    { id: 'user8', name: 'Arjun Reddy', role: 'employee', email: 'arjun@company.com', jobTitle: 'DevOps Engineer', salaryMonthly: 233000 },
    { id: 'user9', name: 'Kavya Sharma', role: 'employee', email: 'kavya@company.com', jobTitle: 'Data Analyst', salaryMonthly: 159000 },
  ],
  clients: [
    {
      id: 'c1',
      name: 'Tech Corp',
      email: 'contact@techcorp.com',
      phone: '+91 9876543210',
      address: 'Bengaluru, IN',
      contact_person: 'Priya Sharma',
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      projects: [
        {
          id: 'p1a',
          name: 'Phoenix Platform Relaunch',
          description: 'Core platform modernization',
          status: 'active',
          startDate: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
          endDate: new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10),
          budget: 1500000,
          allocated_hours: 1200,
          assignedEmployees: ['user3', 'user5'],
          employees: ['user3', 'user5'],
        },
        {
          id: 'p1b',
          name: 'Orion Mobile App',
          description: 'Consumer mobile application',
          status: 'in_progress',
          startDate: new Date(Date.now() - 10 * 86400000).toISOString().slice(0, 10),
          endDate: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
          budget: 900000,
          allocated_hours: 800,
          assignedEmployees: ['user3', 'user4', 'user5'],
          employees: ['user3', 'user4', 'user5'],
        }
      ],
    },
    {
      id: 'c2',
      name: 'Retail Plus',
      email: 'hello@retailplus.com',
      phone: '+91 9988776655',
      address: 'Hyderabad, IN',
      contact_person: 'Rohan Gupta',
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      projects: [
        {
          id: 'p2a',
          name: 'E-commerce Revamp',
          description: 'New storefront and checkout',
          status: 'active',
          startDate: new Date(Date.now() - 45 * 86400000).toISOString().slice(0, 10),
          endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
          budget: 1200000,
          allocated_hours: 1000,
          assignedEmployees: ['user3', 'user4'],
          employees: ['user3', 'user4'],
        }
      ],
    }
  ],
  tasks: [
    {
      id: 't1',
      projectId: 'p1a',
      title: 'Authentication Module',
      description: 'Implement secure login and token refresh',
      status: 'Completed',
      priority: 'High',
      assignedTo: 'user3',
      dueDate: new Date(Date.now() - 2 * 86400000).toISOString(),
      completedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
      id: 't2',
      projectId: 'p1b',
      title: 'List Screen UI',
      status: 'In Progress',
      priority: 'Medium',
      assignedTo: 'user5',
      dueDate: new Date(Date.now() + 5 * 86400000).toISOString(),
    },
    {
      id: 't3',
      projectId: 'p2a',
      title: 'Checkout Optimization',
      status: 'Todo',
      priority: 'High',
      assignedTo: 'user4',
      dueDate: new Date(Date.now() + 10 * 86400000).toISOString(),
    },
  ],
  timeEntries: [
    {
      id: 'te1',
      employeeId: 'user3',
      projectId: 'p1a',
      date: new Date().toISOString().slice(0, 10),
      hours: 3.5,
      description: 'API integration',
      startTime: new Date(Date.now() - 4 * 3600000).toISOString(),
      endTime: new Date(Date.now() - 0.5 * 3600000).toISOString(),
      isActive: false,
    },
    {
      id: 'te2',
      employeeId: 'user5',
      projectId: 'p1b',
      date: new Date().toISOString().slice(0, 10),
      hours: 2,
      description: 'UI polish',
      startTime: new Date(Date.now() - 3 * 3600000).toISOString(),
      endTime: new Date(Date.now() - 1 * 3600000).toISOString(),
      isActive: false,
    },
  ],
};


