// hooks/useHistory.ts
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from "@/config";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";

// Define the user type that comes from the API
interface ChangedByUser {
  id: string;
  full_name: string;
  email: string;
  user_id: string;
}

// Base history type
interface BaseHistory {
  id: string;
  employee_id: string;
  reason: string | null;
  notes: string | null;
  created_at: string;
  changed_by: string; // This is the ID
  changed_by_user?: ChangedByUser; // This is the joined user data
}

export interface SalaryHistory extends BaseHistory {
  salary: number;
  effective_date: string;
}

export interface StatusHistory extends BaseHistory {
  status: string;
  effective_date: string;
}

export interface ContractHistory extends BaseHistory {
  contract_type: string;
  start_date: string;
  end_date: string | null;
  probation_end_date: string | null;
  contract_status: string;
}

interface HistoryData {
  salaryHistory: SalaryHistory[];
  statusHistory: StatusHistory[];
  contractHistory: ContractHistory[];
  loading: {
    salary: boolean;
    status: boolean;
    contract: boolean;
  };
  refetch: () => Promise<void>;
}

export const useHistory = (companyId: string, employeeId: string): HistoryData => {
  const [salaryHistory, setSalaryHistory] = useState<SalaryHistory[]>([]);
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
  const [contractHistory, setContractHistory] = useState<ContractHistory[]>([]);
  const [loading, setLoading] = useState({
    salary: true,
    status: true,
    contract: true
  });

  const session = useAuthStore.getState().session;
  const token = session?.access_token;

  // Use useCallback to memoize the fetchAll function
  const fetchAll = useCallback(async () => {
    if (!companyId || !employeeId || !token) return;

    setLoading({ salary: true, status: true, contract: true });

    try {
      // Fetch all in parallel
      const [salaryRes, statusRes, contractRes] = await Promise.all([
        axios.get(
          `${API_BASE_URL}/company/${companyId}/employees/${employeeId}/salary-history`,
          { headers: { Authorization: `Bearer ${token}` } }
        ),
        axios.get(
          `${API_BASE_URL}/company/${companyId}/employees/${employeeId}/status-history`,
          { headers: { Authorization: `Bearer ${token}` } }
        ),
        axios.get(
          `${API_BASE_URL}/company/${companyId}/employees/${employeeId}/contract-history`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
      ]);

      setSalaryHistory(salaryRes.data);
      setStatusHistory(statusRes.data);
      setContractHistory(contractRes.data);
    } catch (error) {
      console.error("Failed to load history:", error);
      toast.error("Failed to load history data");
    } finally {
      setLoading({ salary: false, status: false, contract: false });
    }
  }, [companyId, employeeId, token]); // Dependencies for useCallback

  useEffect(() => {
    fetchAll();
  }, [fetchAll]); // Now fetchAll is stable and won't cause unnecessary re-renders

  return { 
    salaryHistory, 
    statusHistory, 
    contractHistory, 
    loading,
    refetch: fetchAll 
  };
};