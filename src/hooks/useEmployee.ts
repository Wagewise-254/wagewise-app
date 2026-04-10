// hooks/useEmployee.ts
import { useState, useEffect, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import { Employee } from '@/types/employees';
import { API_BASE_URL } from "@/config";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";

interface ApiError {
  error: string;
}

export const useEmployee = (companyId: string, employeeId: string) => {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const session = useAuthStore.getState().session;

  const fetchEmployee = useCallback(async (isSilent = false) => {
    if (!companyId || !employeeId) return;
    
    const token = session?.access_token;
    if (!token) {
      toast.error("Session expired. Please log in again.");
      return;
    }

    try {
      if (!isSilent) setLoading(true);
      setError(null);
      
      const { data } = await axios.get<Employee>(
        `${API_BASE_URL}/company/${companyId}/employees/${employeeId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      setEmployee(data);
    } catch (err) {
      // Type-safe error handling replacing 'any'
      const axiosError = err as AxiosError<ApiError>;
      const errorMessage = axiosError.response?.data?.error || 'Failed to load employee data';
      
      console.error('[useEmployee] Fetch Error:', errorMessage);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [companyId, employeeId, session?.access_token]);

  useEffect(() => {
    fetchEmployee();
  }, [fetchEmployee]);

  return { 
    employee, 
    loading, 
    error, 
    refetch: fetchEmployee 
  };
};