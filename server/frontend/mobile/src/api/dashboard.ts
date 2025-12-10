import { api } from './client';

export interface DashboardOverview {
  totalClients: number;
  activeClients: number;
  // The following fields are optional to accommodate different backend payloads
  clientsWithActiveProjects?: number;
  totalActiveProjects?: number;
  completedProjects: number;
  pendingProjects: number;
  onHoldProjects?: number;
  cancelledProjects?: number;
  totalProjects?: number;
  activeProjects?: number;
  totalActiveEmployees: number;
  totalCost: number;
  activeTimeEntries?: number;
  totalTimeEntries?: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  start_date: string;
  end_date?: string;
  budget: number;
  created_at: string;
  updated_at: string;
  client_name: string;
  client_id: string;
}

export interface TimeEntry {
  id: string;
  project_id: string;
  employee_id: string;
  manager_id: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  cost?: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  project_name?: string;
  employee_name?: string;
  // Optional fields present in some dashboard endpoints
  first_name?: string;
  last_name?: string;
}

export interface Employee {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  department?: string;
  salary_type: 'hourly' | 'daily' | 'monthly';
  salary_amount: number;
  hourly_rate: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

// Dashboard API functions
export interface ActivityLog {
  id: string;
  type: string;
  actor_id?: string;
  actor_name?: string;
  employee_id?: string;
  employee_name?: string;
  project_id?: string;
  project_name?: string;
  task_id?: string;
  task_title?: string;
  description?: string;
  created_at: string;
}

export const dashboardApi = {
  // Get dashboard overview
  getOverview: async (): Promise<{ overview: DashboardOverview; recentActivity: ActivityLog[] }> => {
    const response = await api.get('/api/dashboard/overview');
    return response.data;
  },

  // Get all projects
  getProjects: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    clientId?: string;
  }): Promise<{ projects: Project[]; total: number; page: number; limit: number }> => {
    const response = await api.get('/api/projects', { params });
    return response.data;
  },

  // Get projects assigned to user
  getAssignedProjects: async (): Promise<Project[]> => {
    try {
      const response = await api.get('/api/projects/assigned');
      return response.data.projects || [];
    } catch (error) {
      console.error('Error fetching assigned projects:', error);
      return [];
    }
  },

  // Get all time entries
  getTimeEntries: async (params?: {
    page?: number;
    limit?: number;
    employeeId?: string;
    projectId?: string;
    taskId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ timeEntries: TimeEntry[]; total: number; page: number; limit: number }> => {
    const response = await api.get('/api/time-entries', { params });
    return response.data;
  },

  // Get time entries for specific user
  getUserTimeEntries: async (userId: string, params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<{ timeEntries: TimeEntry[]; total: number; page: number; limit: number }> => {
    try {
      const response = await api.get(`/api/employees/${userId}/time-entries`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching user time entries:', error);
      // Return empty data structure if API fails
      return {
        timeEntries: [],
        total: 0,
        page: 1,
        limit: 100
      };
    }
  },

  // Get active time entries
  getActiveTimeEntries: async (): Promise<TimeEntry[]> => {
    const response = await api.get('/api/time-entries/active');
    return response.data;
  },

  // Get all employees
  getEmployees: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    department?: string;
  }): Promise<{ employees: Employee[]; total: number; page: number; limit: number }> => {
    const response = await api.get('/api/employees', { params });
    return response.data;
  },

  // Get all clients
  getClients: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ clients: Client[]; total: number; page: number; limit: number }> => {
    const response = await api.get('/api/clients', { params });
    return response.data;
  },

  // Get project details
  getProject: async (projectId: string): Promise<Project> => {
    const response = await api.get(`/api/projects/${projectId}`);
    return response.data;
  },

  // Get project statistics
  getProjectStats: async (projectId: string): Promise<any> => {
    const response = await api.get(`/api/projects/${projectId}/stats`);
    return response.data;
  },

  // Start time tracking
  startTimeTracking: async (data: {
    projectId: string;
    description?: string;
  }): Promise<TimeEntry> => {
    const response = await api.post('/api/time-entries/start', data);
    return response.data;
  },

  // Stop time tracking
  stopTimeTracking: async (entryId: string): Promise<TimeEntry> => {
    const response = await api.put(`/api/time-entries/${entryId}/stop`);
    return response.data;
  },

  // Create time entry
  createTimeEntry: async (data: {
    taskId: string;
    employeeId?: string; // Optional - backend will find employee by email for employees
    workDate: string;
    startTime: string;
    endTime?: string;
    description?: string;
  }): Promise<TimeEntry> => {
    const response = await api.post('/api/time-entries', data);
    return response.data;
  },

  // Update time entry
  updateTimeEntry: async (entryId: string, data: {
    startTime?: string;
    endTime?: string;
    description?: string;
  }): Promise<TimeEntry> => {
    const response = await api.put(`/api/time-entries/${entryId}`, data);
    return response.data;
  },

  // Delete time entry
  deleteTimeEntry: async (entryId: string): Promise<void> => {
    await api.delete(`/api/time-entries/${entryId}`);
  },

  // Get task details
  getTaskDetails: async (taskId: string): Promise<any> => {
    const response = await api.get(`/api/tasks/${taskId}`);
    return response.data.task;
  },

  // Get time entries for a specific task
  getTaskTimeEntries: async (taskId: string): Promise<TimeEntry[]> => {
    const response = await api.get('/api/time-entries', { params: { taskId, limit: 1000 } });
    return response.data.timeEntries || [];
  },

  // Get project team members
  getProjectTeam: async (projectId: string): Promise<any> => {
    const response = await api.get(`/api/projects/${projectId}/team`);
    return response.data;
  },

  // Get activity logs for a specific task
  getTaskActivityLogs: async (taskId: string, limit: number = 20): Promise<ActivityLog[]> => {
    const response = await api.get(`/api/dashboard/activity/task/${taskId}`, { params: { limit } });
    return response.data.activities || [];
  },

  // Get all attachments for a specific task
  getTaskAttachments: async (taskId: string): Promise<any[]> => {
    try {
      // First, get all uploads for the task
      const uploadsResponse = await api.get(`/api/task-uploads/task/${taskId}`);
      const uploads = uploadsResponse.data.uploads || [];
      
      // Then, get all attachments for each upload
      const allAttachments: any[] = [];
      for (const upload of uploads) {
        try {
          const attachmentsResponse = await api.get(`/api/task-uploads/${upload.upload_id}/attachments`);
          const attachments = attachmentsResponse.data.attachments || [];
          allAttachments.push(...attachments);
        } catch (error) {
          console.error(`Error fetching attachments for upload ${upload.upload_id}:`, error);
        }
      }
      
      return allAttachments;
    } catch (error) {
      console.error('Error fetching task attachments:', error);
      return [];
    }
  },
};

// Helper functions for data processing
export const dashboardHelpers = {
  // Calculate total hours from time entries
  calculateTotalHours: (timeEntries: TimeEntry[]): number => {
    return timeEntries.reduce((total, entry) => {
      if (entry.duration_minutes) {
        return total + (entry.duration_minutes / 60);
      }
      return total;
    }, 0);
  },

  // Get time entries for a specific week
  getTimeEntriesForWeek: (timeEntries: TimeEntry[], startDate: string): TimeEntry[] => {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    
    return timeEntries.filter(entry => {
      const entryDate = new Date(entry.start_time);
      return entryDate >= start && entryDate <= end;
    });
  },

  // Calculate project progress (placeholder - would need task data)
  calculateProjectProgress: (projectId: string, timeEntries: TimeEntry[]): number => {
    // This is a placeholder calculation
    // In a real app, you'd have tasks and calculate based on completed tasks
    const projectEntries = timeEntries.filter(entry => entry.project_id === projectId);
    const totalHours = dashboardHelpers.calculateTotalHours(projectEntries);
    
    // Mock calculation - assume 100 hours is 100% complete
    return Math.min((totalHours / 100) * 100, 100);
  },

  // Format currency
  formatCurrency: (amount: number): string => {
    return `₹${amount.toLocaleString('en-IN')}`;
  },

  // Format date
  formatDate: (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  },

  // Format time
  formatTime: (dateString: string): string => {
    return new Date(dateString).toLocaleTimeString();
  },
};
