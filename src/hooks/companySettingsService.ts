import { API_BASE_URL } from "@/config";
import { useAuthStore } from "@/stores/authStore";

export interface CompanySettings {
  id: string;
  business_name: string;
  industry: string | null;
  kra_pin: string | null;
  company_email: string | null;
  company_phone: string | null;
  location: string | null;
  nssf_employer: string | null;
  shif_employer: string | null;
  housing_levy_employer: string | null;
  helb_employer: string | null;
  bank_name: string | null;
  branch_name: string | null;
  account_name: string | null;
  account_number: string | null;
  logo_url: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  created_at: string;
  updated_at: string;
}

export type CompanySettingsUpdate = Partial<Omit<CompanySettings, 'id' | 'created_at' | 'updated_at'>>;

export interface CompanySettingsSummary {
  id: string;
  business_name: string;
  kra_pin: string | null;
  company_email: string | null;
  company_phone: string | null;
  location: string | null;
  logo_url: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  created_at: string;
  employees_count: number;
  departments_count: number;
}

export const getCompanySettings = async (companyId: string): Promise<CompanySettings> => {
  const session = useAuthStore.getState().session;
  const token = session?.access_token;

  const response = await fetch(`${API_BASE_URL}/company/${companyId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch company settings');
  }

  return response.json();
};

export const getCompanySettingsSummary = async (companyId: string): Promise<CompanySettingsSummary> => {
  const session = useAuthStore.getState().session;
  const token = session?.access_token;

  const response = await fetch(`${API_BASE_URL}/company/${companyId}/settings`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch company summary');
  }

  return response.json();
};

export const updateCompanySettings = async (
  companyId: string, 
  data: Partial<CompanySettings>,
  logoFile?: File | null
): Promise<CompanySettings> => {
  const session = useAuthStore.getState().session;
  const token = session?.access_token;

  const formData = new FormData();
  
  // Append all data fields
  Object.entries(data).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      formData.append(key, String(value));
    }
  });

  // Append logo if provided
  if (logoFile) {
    formData.append('logo', logoFile);
  }

  const response = await fetch(`${API_BASE_URL}/company/${companyId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update company settings');
  }

  return response.json();
};