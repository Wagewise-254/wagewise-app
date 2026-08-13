// src/pages/company/payroll/reviews/hooks/usePayrollReview.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { API_BASE_URL } from "@/config";
import { PayrollDetail, ReviewStatus, ReviewStatusResponse } from "../types";

const REVIEW_QUERY_KEY = "payrollReview";

// Get review status for payroll run
export const useReviewStatus = (companyId: string, runId: string) => {
  return useQuery<ReviewStatusResponse>({
    queryKey: [REVIEW_QUERY_KEY, "status", companyId, runId],
    queryFn: async () => {
      const response = await api.get<ReviewStatusResponse>(
        `/company/${companyId}/payroll/runs/${runId}/review-status`,
      );

      return response;

      
    },
    enabled: !!companyId && !!runId,
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Get payroll details for review table
export const usePayrollDetails = (companyId: string, runId: string) => {
  return useQuery<PayrollDetail[]>({
    queryKey: [REVIEW_QUERY_KEY, "details", companyId, runId],
    queryFn: async () => {
      const response = await api.get<PayrollDetail[]>(
        `/company/${companyId}/payroll/runs/${runId}/details`,
      );
      return response;
    },
    enabled: !!companyId && !!runId,
    staleTime: 30 * 1000,
  });
};

// Get payroll summary for sidebar
export const usePayrollSummary = (companyId: string) => {
  return useQuery({
    queryKey: [REVIEW_QUERY_KEY, "summary", companyId],
    queryFn: async () => {
      const response = await api.get(`/company/${companyId}/payroll/summary`);
      return response;
    },
    enabled: !!companyId,
    staleTime: 60 * 1000,
  });
};

// Update single review
export const useUpdateReview = (companyId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reviewId,
      status,
    }: {
      reviewId: string;
      status: ReviewStatus;
    }) => {
      const response = await api.patch(
        `/company/${companyId}/payroll/reviews/${reviewId}`,
        { status },
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [REVIEW_QUERY_KEY],
      });
    },
  });
};

// Bulk update reviews
export const useBulkUpdateReviews = (companyId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reviewIds,
      status,
    }: {
      reviewIds: string[];
      status: ReviewStatus;
    }) => {
      const response = await api.post(
        `/company/${companyId}/payroll/reviews/bulk`,
        { reviewIds, status },
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [REVIEW_QUERY_KEY],
      });
    },
  });
};

// Approve entire payroll run
export const useApprovePayrollRun = (companyId: string, runId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post(
        `/company/${companyId}/payroll/runs/${runId}/approve`,
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [REVIEW_QUERY_KEY],
      });
    },
  });
};

// Cancel payroll run
export const useCancelPayrollRun = (companyId: string, runId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post(
        `/company/${companyId}/payroll/runs/${runId}/cancel`,
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [REVIEW_QUERY_KEY],
      });
    },
  });
};

// Recalculate payroll
export const useRecalculatePayroll = (companyId: string, runId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Make the request with streaming response
      const response = await fetch(
        `${API_BASE_URL}/company/${companyId}/payroll/runs/${runId}/recalculate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${useAuthStore.getState().session?.access_token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Recalculation failed");
      }

      // Return the response for streaming
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [REVIEW_QUERY_KEY],
      });
    },
  });
};

// Get company reviewers
export const useCompanyReviewers = (companyId: string) => {
  return useQuery({
    queryKey: ["companyReviewers", companyId],
    queryFn: async () => {
      const response = await api.get(`/company/${companyId}/reviewers`);
      return response;
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useRevertPayrollRun = (companyId: string, runId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post(
        `/company/${companyId}/payroll/runs/${runId}/revert`,
        { targetStatus: "UNDER_REVIEW" },
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [REVIEW_QUERY_KEY],
      });
    },
  });
};
