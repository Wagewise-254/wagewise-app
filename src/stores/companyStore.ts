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
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  }
}));
