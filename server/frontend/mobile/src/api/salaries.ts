import { api } from './client';

export interface Salary {
  id: string;
  employee_id: string;
  salary_type: 'hourly' | 'daily' | 'monthly';
  salary_amount: number;
  hourly_rate?: number;
  effective_date: string;
  end_date?: string;
  is_current: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  first_name?: string;
  last_name?: string;
  emp_id?: string;
  department?: string;
}

export interface SalaryStats {
  overall_stats: {
    total_salaries: number;
    employees_with_salaries: number;
    average_salary: number;
    min_salary: number;
    max_salary: number;
    current_salaries: number;
  };
  department_stats: Array<{
    department: string;
    salary_count: number;
    avg_salary: number;
    min_salary: number;
    max_salary: number;
  }>;
}

export interface SalaryFilters {
  page?: number;
  limit?: number;
  employee_id?: string;
  salary_type?: string;
  is_current?: boolean;
  start_date?: string;
  end_date?: string;
  search?: string;
}

export const salariesApi = {
  // Get all salaries with optional filters
  getAll: async (filters: SalaryFilters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.employee_id) params.append('employee_id', filters.employee_id);
    if (filters.salary_type) params.append('salary_type', filters.salary_type);
    if (filters.is_current !== undefined) params.append('is_current', filters.is_current.toString());
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.search) params.append('search', filters.search);
    
    const response = await api.get(`/salaries?${params.toString()}`);
    return response.data;
  },

  // Get current salaries for all employees
  getCurrent: async () => {
    const response = await api.get('/salaries/current');
    return response.data;
  },

  // Get salary history for specific employee
  getByEmployee: async (employeeId: string, includeInactive = false) => {
    const params = new URLSearchParams();
    if (includeInactive) params.append('include_inactive', 'true');
    
    const response = await api.get(`/salaries/employee/${employeeId}?${params.toString()}`);
    return response.data;
  },

  // Get salary statistics
  getStats: async () => {
    const response = await api.get('/salaries/stats');
    return response.data;
  },

  // Create new salary record
  create: async (salaryData: {
    employee_id: string;
    salary_type: 'hourly' | 'daily' | 'monthly';
    salary_amount: number;
    hourly_rate?: number;
    effective_date: string;
    end_date?: string;
    notes?: string;
  }) => {
    const response = await api.post('/salaries', salaryData);
    return response.data;
  },

  // Update salary record
  update: async (id: string, salaryData: {
    salary_type?: 'hourly' | 'daily' | 'monthly';
    salary_amount?: number;
    hourly_rate?: number;
    effective_date?: string;
    end_date?: string;
    is_current?: boolean;
    notes?: string;
  }) => {
    const response = await api.put(`/salaries/${id}`, salaryData);
    return response.data;
  },

  // Delete salary record
  delete: async (id: string) => {
    const response = await api.delete(`/salaries/${id}`);
    return response.data;
  },
};
