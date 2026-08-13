// src/pages/company/payroll/hooks/usePayrollHub.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

// Get payslip data
export const usePayrollPayslips = (companyId: string, runId: string) => {
  return useQuery({
    queryKey: ["payrollHub", "payslips", companyId, runId],
    queryFn: async () => {
      try {
        const response = await api.get(
          `/company/${companyId}/payroll/runs/${runId}/payslips/summary`
        );
        return response;
      } catch {
        // Return mock data if endpoint doesn't exist yet
        return {
          total: 0,
          generated: 0,
          sent: 0,
          viewed: 0,
        };
      }
    },
    enabled: !!companyId && !!runId,
    staleTime: 60 * 1000,
  });
};

// Get reports data
export const usePayrollReports = (companyId: string, runId: string) => {
  return useQuery({
    queryKey: ["payrollHub", "reports", companyId, runId],
    queryFn: async () => {
      try {
        const response = await api.get(
          `/company/${companyId}/payroll/runs/${runId}/reports/summary`
        );
        return response;
      } catch {
        // Return mock data if endpoint doesn't exist yet
        return {
          total: 0,
          ready: 0,
        };
      }
    },
    enabled: !!companyId && !!runId,
    staleTime: 60 * 1000,
  });
};

// Get payment methods
export const usePayrollPaymentMethods = (companyId: string) => {
  return useQuery({
    queryKey: ["payrollHub", "paymentMethods", companyId],
    queryFn: async () => {
      try {
        const response = await api.get(
          `/company/${companyId}/payroll/payment-methods`
        );
        return response;
      } catch {
        // Return mock data if endpoint doesn't exist yet
        return [];
      }
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
};