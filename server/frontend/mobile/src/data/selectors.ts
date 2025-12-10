import { api } from '../api/client';

// Convert legacy synchronous selectors with cache/mock into async API-only helpers.
// All callers should migrate to these async functions and remove any mock/caching usage.

export async function fetchAllClients(): Promise<any[]> {
  const res = await api.get('/api/clients', { params: { page: 1, limit: 100 } });
  const apiClients = res.data?.clients || [];
  return apiClients.map((c: any, index: number) => ({
    id: c.id,
    name: c.name,
    clientCode: `CLT-${String(index + 1).padStart(3, '0')}`,
    email: c.email,
    phone: c.phone,
    address: c.address,
    contact_person: c.contact_person,
    status: c.status || 'ACTIVE',
    created_at: c.created_at,
    updated_at: c.updated_at,
  }));
}

export async function fetchAllProjects(): Promise<any[]> {
  const res = await api.get('/api/projects', { params: { page: 1, limit: 100 } });
  const apiProjects = res.data?.projects || [];
  return apiProjects.map((p: any, index: number) => ({
    id: p.id,
    name: p.name,
    projectCode: `PRJ-${String(index + 1).padStart(3, '0')}`,
    totalHours: 0,
    totalCost: 0,
    status: p.status,
    startDate: p.start_date,
    endDate: p.end_date,
    assignedEmployees: [],
    employees: [],
    clientId: p.client_id,
    clientName: p.client_name,
  }));
}

export async function fetchProjectsByClient(clientId: string): Promise<any[]> {
  const res = await api.get('/api/projects', { params: { page: 1, limit: 100, clientId } });
  const apiProjects = res.data?.projects || [];
  return apiProjects.map((p: any, index: number) => ({
    id: p.id,
    name: p.name,
    projectCode: `PRJ-${String(index + 1).padStart(3, '0')}`,
    description: p.description,
    status: p.status,
    start_date: p.start_date,
    end_date: p.end_date,
    budget: p.budget || 0,
    allocated_hours: p.allocated_hours || 0,
    client_id: p.client_id,
    client_name: p.client_name,
  }));
}

export async function fetchAllEmployees(): Promise<any[]> {
  const res = await api.get('/api/employees', { params: { page: 1, limit: 100 } });
  const list = Array.isArray(res.data?.employees) ? res.data.employees : [];
  return list;
}

export async function fetchAllTimeEntries(params?: any): Promise<any[]> {
  const res = await api.get('/api/time-entries', { params });
  const list = Array.isArray(res.data?.timeEntries) ? res.data.timeEntries : (Array.isArray(res.data) ? res.data : []);
  return list;
}
