// src/stores/companyStore.ts
import { create } from 'zustand';
import { useAuthStore } from './authStore';
import { API_BASE_URL } from '@/config';

export interface Company {
  id: string;
  business_name: string;
  business_type?: string;
  kra_pin?: string;
  nssf_employer?: string;
  shif_employer?: string;
  helb_employer?: string;
  housing_levy_employer?: string;
  address?: string;
  company_phone?: string;
  company_email?: string;
  logo_url?: string;
  status?: string;
  // Add other fields from your table if needed
}

interface CompanyState {
  companies: Company[];
  loading: boolean;
  error: string | null;
  fetchCompanies: () => Promise<void>;
  addCompany: (formData: FormData) => Promise<void>;
  updateCompany: (companyId: string, formData: FormData) => Promise<void>;
  transferCompany: (companyId: string, recipientEmail: string) => Promise<void>;
}

export const useCompanyStore = create<CompanyState>((set) => ({
  companies: [],
  loading: false,
  error: null,

  fetchCompanies: async () => {
    set({ loading: true, error: null });
    const session = useAuthStore.getState().session;
    if (!session) {
      set({ error: "User not authenticated.", loading: false });
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/companies`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch companies.');
      }

      const companiesData = await response.json();
      set({ companies: companiesData || [], loading: false });
    } catch (error: unknown) {
      if (error instanceof Error) {
        set({ error: error.message, loading: false });
      } else {
        set({ error: 'An unknown error occurred', loading: false });
      }
    }
  },

  addCompany: async (formData) => {
    set({ loading: true, error: null });
    const session = useAuthStore.getState().session;
    if (!session) throw new Error("User not authenticated.");

    try {
      const response = await fetch(`${API_BASE_URL}/companies`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add company.');
      }

      const newCompany = await response.json();
      set((state) => ({
        companies: [...state.companies, newCompany],
        loading: false,
      }));

    } catch (error: unknown) {
      if (error instanceof Error) {
        set({ error: error.message, loading: false });
      } else {
        set({ error: 'An unknown error occurred', loading: false });
      }
      throw error;
    }
  },

  updateCompany: async (companyId, formData) => {
    set({ loading: true, error: null });
    const session = useAuthStore.getState().session;
    if (!session) throw new Error("User not authenticated.");

    try {
      const response = await fetch(`${API_BASE_URL}/companies/${companyId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update company.');
      }

      const updatedCompany = await response.json();
      set((state) => ({
        companies: state.companies.map((c) =>
          c.id === updatedCompany.id ? updatedCompany : c
        ),
        loading: false,
      }));
    } catch (error: unknown) {
      if (error instanceof Error) {
        set({ error: error.message, loading: false });
      } else {
        set({ error: 'An unknown error occurred', loading: false });
      }
      throw error;
    }
  },

  transferCompany: async (companyId, recipientEmail) => {
    set({ loading: true, error: null });
    const session = useAuthStore.getState().session;
    if (!session) throw new Error("User not authenticated.");

    try {
      const response = await fetch(`${API_BASE_URL}/companies/${companyId}/transfer`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ recipientEmail }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to transfer company ownership.');
      }

      // Remove the company from the local state after a successful transfer
      set((state) => ({
        companies: state.companies.filter((c) => c.id !== companyId),
        loading: false,
      }));
      
    } catch (error: unknown) {
      if (error instanceof Error) {
        set({ error: error.message, loading: false });
      } else {
        set({ error: 'An unknown error occurred', loading: false });
      }
      throw error;
    }
  }
}));