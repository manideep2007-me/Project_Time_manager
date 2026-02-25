import { api } from './client';

// Types
export type LoginPayload = { email: string; password: string };
export type RegisterPayload = { email: string; password: string; firstName: string; lastName: string; phone?: string; organizationCode?: string; role?: string };
export type PaginatedParams = { page?: number; limit?: number } & Record<string, any>;

// Auth
export async function login(payload: LoginPayload) {
  const res = await api.post('/api/auth/login', payload);
  return res.data as { message: string; user: any; token: string };
}

export async function register(payload: RegisterPayload) {
  const res = await api.post('/api/auth/register', payload);
  return res.data as { message: string; user: any; token: string };
}

export async function fetchProfile() {
  const res = await api.get('/api/auth/profile');
  return res.data as { user: any };
}

export async function changePassword(payload: { currentPassword: string; newPassword: string }) {
  const res = await api.put('/api/auth/change-password', payload);
  return res.data as { message: string };
}

// Projects
export async function listProjects(params: PaginatedParams = {}) {
  const res = await api.get('/api/projects', { params });
  return res.data as { projects: any[]; pagination: any };
}

export async function getProject(id: string | number) {
  const res = await api.get(`/api/projects/${id}`);
  return res.data as { project: any };
}

export async function createProject(payload: any) {
  const res = await api.post('/api/projects', payload);
  return res.data;
}

// Organizations (public onboarding)
export async function registerOrganization(payload: { 
  name: string; 
  address: string; 
  industry?: string;
  city?: string;
  state_province?: string;
  country?: string;
  zip_code?: string;
  logo_url?: string;
  licence_key: string; 
  licence_number: string; 
  max_employees: number; 
  licence_type: string; 
  admin_email: string; 
  admin_phone: string; 
  admin_password: string;
}) {
  const res = await api.post('/api/organizations/register', payload);
  return res.data as { organization: { id: string; unique_id: string; name: string; join_code: string } };
}

export async function resolveOrganizationByCode(code: string) {
  const res = await api.get(`/api/organizations/resolve/${encodeURIComponent(code)}`);
  return res.data as { organization: any };
}

export async function joinOrganization(payload: { code: string; first_name: string; last_name?: string; email?: string; phone?: string; department?: string }) {
  const res = await api.post('/api/organizations/join', payload);
  return res.data as { success: boolean; employee: any; organization_id: string };
}

export async function getMyOrganization() {
  const res = await api.get('/api/organizations/my-organization');
  return res.data as { organization: { id: string; name: string; join_code: string; unique_id: string } };
}

export async function updateProject(id: string | number, payload: any) {
  const res = await api.put(`/api/projects/${id}`, payload);
  return res.data;
}

export async function deleteProject(id: string | number) {
  const res = await api.delete(`/api/projects/${id}`);
  return res.data;
}

export async function getProjectStats(id: string | number) {
  const res = await api.get(`/api/projects/${id}/stats`);
  return res.data;
}

// Clients
export async function listClients(params: PaginatedParams = {}) {
  const res = await api.get('/api/clients', { params });
  return res.data as { clients: any[]; pagination: any };
}

export async function getClient(id: string | number) {
  const res = await api.get(`/api/clients/${id}`);
  return res.data as { client: any };
}

export async function createClient(payload: any) {
  const res = await api.post('/api/clients', payload);
  return res.data;
}

export async function updateClient(id: string | number, payload: any) {
  const res = await api.put(`/api/clients/${id}`, payload);
  return res.data;
}

export async function deleteClient(id: string | number) {
  const res = await api.delete(`/api/clients/${id}`);
  return res.data;
}

export async function getClientProjects(id: string | number) {
  const res = await api.get(`/api/clients/${id}/projects`);
  return res.data as { projects: any[] };
}

// Time Entries
export async function listTimeEntries(params: PaginatedParams = {}) {
  const res = await api.get('/api/time-entries', { params });
  return res.data as { timeEntries: any[]; pagination: any };
}

export async function getEmployeeRecentTimeEntries(employeeId: string, limit: number = 3) {
  const res = await api.get('/api/time-entries', { 
    params: { employeeId, limit, page: 1 } 
  });
  return res.data as { timeEntries: any[]; pagination: any };
}

export async function getTimeEntry(id: string | number) {
  const res = await api.get(`/api/time-entries/${id}`);
  return res.data as { timeEntry: any };
}

export async function startTimeEntry(payload: { projectId: number; employeeId: number; description?: string }) {
  const res = await api.post('/api/time-entries/start', payload);
  return res.data;
}

export async function stopTimeEntry(id: string | number, payload: { description?: string }) {
  const res = await api.put(`/api/time-entries/${id}/stop`, payload);
  return res.data;
}

export async function createTimeEntry(payload: { projectId: number; employeeId: number; startTime: string; endTime: string; description?: string }) {
  const res = await api.post('/api/time-entries', payload);
  return res.data;
}

export async function updateTimeEntry(id: string | number, payload: { startTime: string; endTime: string; description?: string }) {
  const res = await api.put(`/api/time-entries/${id}`, payload);
  return res.data;
}

export async function deleteTimeEntry(id: string | number) {
  const res = await api.delete(`/api/time-entries/${id}`);
  return res.data;
}

export async function listActiveTimeEntries() {
  const res = await api.get('/api/time-entries/active');
  return res.data as { activeTimeEntries: any[] };
}

// Tasks API
export async function listProjectTasks(projectId: string, page = 1, limit = 100) {
  const res = await api.get(`/api/projects/${projectId}/tasks`, { params: { page, limit } });
  return res.data as { tasks: any[]; total: number; page: number; limit: number };
}

export async function createProjectTask(projectId: string, payload: { title: string; status?: 'todo'|'in_progress'|'done'|'overdue'; assignedTo?: string; dueDate?: string }) {
  const res = await api.post(`/api/projects/${projectId}/tasks`, payload);
  return res.data as { task: any };
}

export async function getEmployeeTasks(employeeId: string, page = 1, limit = 100, status?: string) {
  const params: any = { page, limit };
  if (status) params.status = status;
  const res = await api.get(`/api/tasks/employee/${employeeId}`, { params });
  return res.data as { tasks: any[]; total: number; page: number; limit: number };
}

export async function updateTask(taskId: string, payload: { title?: string; status?: 'todo'|'in_progress'|'done'|'overdue'; assignedTo?: string; dueDate?: string }) {
  const res = await api.patch(`/api/tasks/${taskId}`, payload);
  return res.data as { task: any };
}

// Employees
export async function listEmployees(params: PaginatedParams = {}) {
  const res = await api.get('/api/employees', { params });
  return res.data as { employees: any[]; pagination: any };
}

export async function getEmployee(id: string | number) {
  const res = await api.get(`/api/employees/${id}`);
  return res.data as { employee: any };
}

export async function createEmployee(payload: any) {
  const res = await api.post('/api/employees', payload);
  return res.data;
}

export async function updateEmployee(id: string | number, payload: any) {
  const res = await api.put(`/api/employees/${id}`, payload);
  return res.data;
}

export async function deleteEmployee(id: string | number) {
  const res = await api.delete(`/api/employees/${id}`);
  return res.data;
}

export async function getEmployeeAnalytics(params: { employeeId: number; startDate?: string; endDate?: string }) {
  const res = await api.get(`/api/employees/${params.employeeId}/analytics`, { params });
  return res.data;
}

// Dashboard
export async function getOverview() {
  const res = await api.get('/api/dashboard/overview');
  return res.data;
}

export async function getProjectAnalytics(params: { projectId: number; startDate?: string; endDate?: string }) {
  const res = await api.get('/api/dashboard/projects/analytics', { params });
  return res.data;
}

export async function getCostAnalysis(params: { startDate?: string; endDate?: string; groupBy?: 'project' | 'employee' | 'client' }) {
  const res = await api.get('/api/dashboard/cost-analysis', { params });
  return res.data;
}

// Project Team Members (old endpoint - derived from tasks)
export async function getProjectTeamMembers(projectId: string) {
  const res = await api.get(`/api/projects/${projectId}/team-members`);
  return res.data as { teamMembers: Array<{ id: string; first_name: string; last_name: string; email: string; employee_id: string }> };
}

// Project Team (new endpoint - from project_team_memberships table)
export async function getProjectTeam(projectId: string) {
  const res = await api.get(`/api/projects/${projectId}/team`);
  return res.data as { 
    project: { id: string; name: string };
    teamMembers: Array<{ 
      id: string; 
      employee_id: string;
      first_name: string; 
      last_name: string; 
      email: string;
      department: string;
      role: string;
      added_at: string;
      membership_id: string;
    }>;
    teamSize: number;
  };
}

// Add Project Team Member
export async function addProjectTeamMember(projectId: string, employeeId: string, role = 'member') {
  const res = await api.post(`/api/projects/${projectId}/team`, { employeeId, role });
  return res.data;
}

// Remove Project Team Member
export async function removeProjectTeamMember(projectId: string, employeeId: string) {
  const res = await api.delete(`/api/projects/${projectId}/team/${employeeId}`);
  return res.data;
}

// Task Assignment
export async function assignTask(taskId: string, assignedTo: string) {
  const res = await api.patch(`/api/tasks/${taskId}/assign`, { assignedTo });
  return res.data as { task: any; assignedTo: { id: string; first_name: string; last_name: string; name: string } };
}

// Permissions (Admin)
export type PermissionMatrixRow = { 
  id: string; 
  name: string; 
  description?: string; 
  access: { admin: boolean; manager: boolean; employee: boolean } 
};
export async function getPermissionsMatrix() {
  const res = await api.get('/api/permissions');
  return res.data as { roles: Array<'admin'|'manager'|'employee'>; permissions: PermissionMatrixRow[] };
}

export async function updatePermissions(updates: Array<{ role: 'admin'|'manager'|'employee'; permissionId: string; hasAccess: boolean }>) {
  const res = await api.post('/api/permissions/update', { updates });
  return res.data as { message: string };
}

// Task Details
export async function getTaskDetails(taskId: string) {
  const res = await api.get(`/api/tasks/${taskId}`);
  return res.data as { task: any };
}

// Time Entries for Task
export async function getTaskTimeEntries(taskId: string) {
  const res = await api.get('/api/time-entries', { params: { taskId, limit: 1000 } });
  return res.data as { timeEntries: any[]; pagination: any };
}