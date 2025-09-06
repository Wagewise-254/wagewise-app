// src/stores/hrStore.ts
import { create } from 'zustand';
import { toast } from 'sonner';
import { useAuthStore } from './authStore';
import { API_BASE_URL } from '@/config';

export interface Department {
  id: string;
  name: string;
  company_id: string;
  created_at: string;
  updated_at: string;
  employee_count: number;
  description?: string | null; // Add this line
}

export interface Employee {
  id: string;
  company_id: string;
  department_id: string | null;
  employee_number: string;
  first_name: string;
  last_name: string;
  other_names: string | null;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  date_joined: string;
  job_title: string | null;
  job_type: string | null;
  employee_status: string;
  employee_status_effective_date: string;
  id_type: string | null;
  id_number: string | null;
  krapin: string | null;
  shif_number: string | null;
  nssf_number: string | null;
  citizenship: string | null;
  has_disability: boolean;
  salary: number;
  pays_paye: boolean;
  pays_nssf: boolean;
  pays_helb: boolean;
  pays_housing_levy: boolean;
  employee_type?: string | null;
  departments: { name: string } | null;
}

interface HrState {
  employees: Employee[];
  departments: Department[];
  loading: boolean;
  error: string | null;

  fetchEmployees: (companyId: string) => Promise<void>;
  addEmployee: (companyId: string, employeeData: Omit<Employee, 'id' | 'company_id' | 'departments' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  updateEmployee: (companyId: string, employeeId: string, employeeData: Partial<Employee>) => Promise<boolean>;
  deleteEmployee: (companyId: string, employeeId: string) => Promise<boolean>;
  deleteEmployees: (companyId: string, employeeIds: string[]) => Promise<boolean>;
  updateEmployeeStatus: (companyId: string, employeeId: string, employeeData: Partial<Employee>) => Promise<boolean>;

  fetchDepartments: (companyId: string) => Promise<void>;
  addDepartment: (companyId: string, departmentData: Omit<Department, 'id' | 'company_id' | 'created_at' | 'updated_at' | 'employee_count'>) => Promise<boolean>;
  updateDepartment: (companyId: string, departmentId: string, departmentData: Partial<Department>) => Promise<boolean>;
  deleteDepartment: (companyId: string, departmentId: string) => Promise<boolean>;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const useHrStore = create<HrState>((set) => ({
  employees: [],
  departments: [],
  loading: false,
  error: null,

  fetchEmployees: async (companyId) => {
    set({ loading: true, error: null });
    const { session } = useAuthStore.getState();
    const token = session?.access_token;

    if (!token) {
      set({ loading: false, error: 'Authentication token missing.' });
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/company/${companyId}/employees`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch employees.');
      }

      const data = await response.json();
      set({ employees: data, loading: false });
    } catch (err: unknown) {
      set({ loading: false, error: (err as Error).message });
      toast.error((err as Error).message);
    }
  },

  addEmployee: async (companyId, employeeData) => {
    set({ loading: true, error: null });
    const { session } = useAuthStore.getState();
    const token = session?.access_token;

    if (!token) {
      set({ loading: false, error: 'Authentication token missing.' });
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/company/${companyId}/employees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(employeeData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add employee.');
      }

      const newEmployee = await response.json();
      set(state => ({
        employees: [...state.employees, { ...newEmployee, departments: newEmployee.departments || null }],
        loading: false,
      }));
      toast.success('Employee added successfully!');
      return true;
    } catch (err: unknown) {
      set({ loading: false, error: (err as Error).message });
      toast.error((err as Error).message);
      return false;
    }
  },

  updateEmployee: async (companyId, employeeId, employeeData) => {
    set({ loading: true, error: null });
    const { session } = useAuthStore.getState();
    const token = session?.access_token;

    if (!token) {
      set({ loading: false, error: 'Authentication token missing.' });
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/company/${companyId}/employees/${employeeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(employeeData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update employee.');
      }

      const updatedEmployee = await response.json();
      set(state => ({
        employees: state.employees.map(emp =>
          emp.id === employeeId ? { ...emp, ...updatedEmployee, departments: updatedEmployee.departments || null } : emp
        ),
        loading: false,
      }));
      toast.success('Employee updated successfully!');
      return true;
    } catch (err: unknown) {
      set({ loading: false, error: (err as Error).message });
      toast.error((err as Error).message);
      return false;
    }
  },

  updateEmployeeStatus: async (companyId, employeeId, statusData) => {
    set({ loading: true, error: null });
    const { session } = useAuthStore.getState();
    const token = session?.access_token;


    if (!token) {
    set({ loading: false, error: 'Authentication token missing.' });
    toast.error('Authentication failed. Please log in again.');
    return false;
  }

    try {
      const response = await fetch(`${API_BASE_URL}/company/${companyId}/employees/${employeeId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(statusData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update employee.');
      }
      const updatedEmployeeStatus = await response.json();
      set(state => ({
        employees: state.employees.map(emp =>
          emp.id === employeeId ? { ...emp, ...updatedEmployeeStatus } : emp
        ),
        loading: false,
      }));
      toast.success('Employee status updated successfully!');
      return true;
    } catch (err) {
      console.error('Failed to update employee status:', err);
    set({ loading: false, error: (err as Error).message });
    toast.error((err as Error).message);
    return false;
    }
  },

  deleteEmployee: async (companyId, employeeId) => {
    set({ loading: true, error: null });
    const { session } = useAuthStore.getState();
    const token = session?.access_token;

    if (!token) {
      set({ loading: false, error: 'Authentication token missing.' });
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/company/${companyId}/employees/${employeeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete employee.');
      }

      set(state => ({
        employees: state.employees.filter(emp => emp.id !== employeeId),
        loading: false,
      }));
      toast.success('Employee deleted successfully!');
      return true;
    } catch (err: unknown) {
      set({ loading: false, error: (err as Error).message });
      toast.error((err as Error).message);
      return false;
    }
  },

    deleteEmployees: async (companyId, employeeIds) => {
    set({ loading: true, error: null });
    const { session } = useAuthStore.getState();
    const token = session?.access_token;

    if (!token) {
      set({ loading: false, error: 'Authentication token missing.' });
      return false;
    }

    try {
      // This implementation sends a separate delete request for each employee
      const results = await Promise.all(employeeIds.map(employeeId =>
        fetch(`${API_BASE_URL}/company/${companyId}/employees/${employeeId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
      ));

      const successfulDeletes = results.filter(res => res.ok);
      const failedDeletes = results.filter(res => !res.ok);

      if (failedDeletes.length > 0) {
        throw new Error('Failed to delete some employees.');
      }

      set(state => ({
        employees: state.employees.filter(emp => !employeeIds.includes(emp.id)),
        loading: false,
      }));
      toast.success(`${employeeIds.length} employees deleted successfully!`);
      return true;

    } catch (err: unknown) {
      set({ loading: false, error: (err as Error).message });
      toast.error((err as Error).message);
      return false;
    }
  },
  
  fetchDepartments: async (companyId) => {
    set({ loading: true, error: null });
    const { session } = useAuthStore.getState();
    const token = session?.access_token;

    if (!token) {
      set({ loading: false, error: 'Authentication token missing.' });
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/company/${companyId}/departments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch departments.');
      }

      const data = await response.json();
      set({ departments: data, loading: false });
    } catch (err: unknown) {
      set({ loading: false, error: (err as Error).message });
      toast.error((err as Error).message);
    }
  },

  addDepartment: async (companyId, departmentData) => {
    set({ loading: true, error: null });
    const { session } = useAuthStore.getState();
    const token = session?.access_token;

    if (!token) {
      set({ loading: false, error: 'Authentication token missing.' });
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/company/${companyId}/departments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(departmentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add department.');
      }

      const newDepartment = await response.json();
      set(state => ({ departments: [...state.departments, newDepartment], loading: false }));
      toast.success('Department added successfully!');
      return true;
    } catch (err: unknown) {
      set({ loading: false, error: (err as Error).message });
      toast.error((err as Error).message);
      return false;
    }
  },

  updateDepartment: async (companyId, departmentId, departmentData) => {
    set({ loading: true, error: null });
    const { session } = useAuthStore.getState();
    const token = session?.access_token;

    if (!token) {
      set({ loading: false, error: 'Authentication token missing.' });
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/company/${companyId}/departments/${departmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(departmentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update department.');
      }

      const updatedDepartment = await response.json();
      set(state => ({
        departments: state.departments.map(dep =>
          dep.id === departmentId ? { ...dep, ...updatedDepartment } : dep
        ),
        loading: false,
      }));
      toast.success('Department updated successfully!');
      return true;
    } catch (err: unknown) {
      set({ loading: false, error: (err as Error).message });
      toast.error((err as Error).message);
      return false;
    }
  },

  deleteDepartment: async (companyId, departmentId) => {
    set({ loading: true, error: null });
    const { session } = useAuthStore.getState();
    const token = session?.access_token;

    if (!token) {
      set({ loading: false, error: 'Authentication token missing.' });
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/company/${companyId}/departments/${departmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete department.');
      }

      set(state => ({
        departments: state.departments.filter(dep => dep.id !== departmentId),
        loading: false,
      }));
      toast.success('Department deleted successfully!');
      return true;
    } catch (err: unknown) {
      set({ loading: false, error: (err as Error).message });
      toast.error((err as Error).message);
      return false;
    }
  }
}));