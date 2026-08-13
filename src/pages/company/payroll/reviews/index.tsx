import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  useReviewStatus,
  usePayrollDetails,
  useUpdateReview,
  useBulkUpdateReviews,
  useApprovePayrollRun,
  useCancelPayrollRun,
  useRecalculatePayroll,
  useRevertPayrollRun,
} from './hooks/usePayrollReview';
import { RefreshCw } from 'lucide-react';
import { ReviewHeader } from './components/ReviewHeader';
import { EmployeeTable } from './components/EmployeeTable';
import { Sidebar } from './components/Sidebar';
import { Card } from '@/components/ui/card';
import { ReviewStatus } from './types';
import { PAYROLL_STATUS, PayrollStatus} from '@/lib/constants';
import { api } from '@/lib/api';

export default function PayrollReviewPage() {
  const { companyId, payrollRunId } = useParams<{ companyId: string; payrollRunId: string }>();
  const navigate = useNavigate();

  // Queries
  const {
    data: reviewStatus,
    isLoading: statusLoading,
    refetch: refetchStatus,
  } = useReviewStatus(companyId!, payrollRunId!);

  //console.log('Review status data:', reviewStatus);

  const {
    data: payrollDetails,
    isLoading: detailsLoading,
    refetch: refetchDetails,
  } = usePayrollDetails(companyId!, payrollRunId!);

  console.log(`Payroll details data:`, payrollDetails);

  // Mutations
  const updateReview = useUpdateReview(companyId!);
  const bulkUpdate = useBulkUpdateReviews(companyId!);
  const approveRun = useApprovePayrollRun(companyId!, payrollRunId!);
  const cancelRun = useCancelPayrollRun(companyId!, payrollRunId!);
  const recalculate = useRecalculatePayroll(companyId!, payrollRunId!);
  const revertRun = useRevertPayrollRun(companyId!, payrollRunId!);

  const [isApproving, setIsApproving] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const payroll = reviewStatus?.payroll;
  console.log('Payroll data:', payroll);
  const currentStatus = payroll?.status as PayrollStatus | undefined;
  const isApproved = currentStatus === PAYROLL_STATUS.APPROVED || 
                     currentStatus === PAYROLL_STATUS.LOCKED || 
                     currentStatus === PAYROLL_STATUS.PAID;
  const isLocked = currentStatus === PAYROLL_STATUS.LOCKED || 
                   currentStatus === PAYROLL_STATUS.PAID;
  const canRecalculate = !isApproved && !isLocked;
  
  // Check if all reviews are approved
  const isFullyApproved = reviewStatus?.isFullyApproved || false;
  const canApprove = !!reviewStatus?.summary?.canApprove && !isApproved;
  
  console.log(`canApprove: ${canApprove}, isApproved: ${isApproved}, isFullyApproved: ${isFullyApproved}`);

  // Auto-update status when entering the review page
  useEffect(() => {
    const updatePayrollStatus = async () => {
      // Only proceed if we have the payroll data and not already updating
      if (!payroll || !payrollRunId || !companyId || isUpdatingStatus) return;

      // Skip if already approved, locked, paid, or under review
      const skipStatuses: PayrollStatus[] = [
        PAYROLL_STATUS.APPROVED,
        PAYROLL_STATUS.LOCKED,
        PAYROLL_STATUS.PAID,
        PAYROLL_STATUS.UNDER_REVIEW,
        PAYROLL_STATUS.CANCELLED,
        PAYROLL_STATUS.REJECTED,
      ];

      if (currentStatus && skipStatuses.includes(currentStatus)) {
        console.log(`Payroll status is ${currentStatus}, skipping auto-update`);
        return;
      }

      // For DRAFT or PREPARED, update to UNDER_REVIEW
      if (currentStatus === PAYROLL_STATUS.DRAFT || currentStatus === PAYROLL_STATUS.PREPARED) {
        setIsUpdatingStatus(true);
        try {
          console.log(`Updating payroll status from ${currentStatus} to ${PAYROLL_STATUS.UNDER_REVIEW}`);
          
          // If it's DRAFT, first update to PREPARED, then to UNDER_REVIEW
          // But since both are allowed transitions to UNDER_REVIEW, we can go directly
          const response = await api.patch(
            `/company/${companyId}/payroll/runs/${payrollRunId}/status`,
            { 
              status: PAYROLL_STATUS.UNDER_REVIEW,
              reason: 'Auto-updated to under review when entering review page'
            }
          );
          
          console.log('Status update response:', response);
          toast.success('Payroll is now under review');
          
          // Refetch data to get updated status
          await refetchStatus();
          await refetchDetails();
        } catch (error) {
          console.error('Failed to update payroll status:', error);
          // Don't show error toast as it might be confusing to the user
          // Just log it silently
        } finally {
          setIsUpdatingStatus(false);
        }
      }
    };

    updatePayrollStatus();
  }, [payroll, currentStatus, payrollRunId, companyId, refetchStatus, refetchDetails, isUpdatingStatus]);

  // Handle single review update
  const handleUpdateReview = async (reviewId: string, status: ReviewStatus) => {
    try {
      await updateReview.mutateAsync({ reviewId, status });
      toast.success(`Review ${status.toLowerCase()} successfully`);
      refetchStatus();
      refetchDetails();
    } catch (error: unknown) {
       toast.error((error as Error)?.message || 'Failed to update review');
    }
  };

  // Handle bulk approve
  const handleBulkApprove = async (reviewIds: string[]) => {
    if (reviewIds.length === 0) return;
    try {
      toast.info(`Approving ${reviewIds.length} employees...`);
      await bulkUpdate.mutateAsync({ reviewIds, status: 'APPROVED' });
      toast.success(`Approved ${reviewIds.length} employees`);
      refetchStatus();
      refetchDetails();
    } catch (error: unknown) {
      toast.error((error as Error)?.message || 'Failed to approve employees');
    }
  };

  // Handle approve all
  const handleApproveAll = async () => {
    const pendingReviewIds = payrollDetails
      ?.filter((e) => e.my_review?.status === 'PENDING')
      .map((e) => e.my_review?.id)
      .filter(Boolean) as string[];

    if (pendingReviewIds.length === 0) {
      toast.info('No pending reviews to approve');
      return;
    }

    try {
      toast.info(`Approving ${pendingReviewIds.length} employees...`);
      await bulkUpdate.mutateAsync({ reviewIds: pendingReviewIds, status: 'APPROVED' });
      toast.success(`Approved ${pendingReviewIds.length} employees`);
      refetchStatus();
      refetchDetails();
    } catch (error: unknown) {
       toast.error((error as Error)?.message || 'Failed to approve all');
    }
  };

  // Handle approve entire payroll run
  const handleApprovePayrollRun = async () => {
    setIsApproving(true);
    try {
      await approveRun.mutateAsync();
      toast.success('Payroll run approved successfully!');
      refetchStatus();
      refetchDetails();
      // Navigate to payroll hub after approval
      setTimeout(() => {
        navigate(`/company/${companyId}/payroll/${payrollRunId}/hub`);
      }, 1500);
    } catch (error: unknown) {
      toast.error((error as Error)?.message || 'Failed to approve payroll run');
    } finally {
      setIsApproving(false);
    }
  };

  // Handle revert payroll run
  const handleRevertPayrollRun = async () => {
    try {
      toast.info('Reverting payroll run...');
      await revertRun.mutateAsync();
      toast.success('Payroll run reverted successfully');
      refetchStatus();
      refetchDetails();
    } catch (error: unknown) {
      toast.error((error as Error)?.message || 'Failed to revert payroll run');
    }
  };

  // Handle cancel payroll run
  const handleCancelPayrollRun = async () => {
    try {
      await cancelRun.mutateAsync();
      toast.success('Payroll run cancelled successfully');
      refetchStatus();
      refetchDetails();
    } catch (error: unknown) {
      toast.error((error as Error)?.message || 'Failed to cancel payroll run');
    }
  };

  // Handle recalculate
 const handleRecalculate = async () => {
  // Navigate to the progress page with the recalculation flag
  navigate(
    `/company/${companyId}/payroll/process?month=${payroll?.payroll_month}&year=${payroll?.payroll_year}&recalculate=true&runId=${payrollRunId}`
  );
};

  // Calculate totals
  const totalGross = payrollDetails?.reduce((sum, e) => sum + (e.gross_pay || 0), 0) || 0;
  const totalNet = payrollDetails?.reduce((sum, e) => sum + (e.net_pay || 0), 0) || 0;
  const totalDeductions = payrollDetails?.reduce((sum, e) => sum + (e.total_deductions || 0), 0) || 0;
  const totalAllowances = payrollDetails?.reduce((sum, e) => sum + (e.total_allowances || 0), 0) || 0;
  const totalEmployees = payrollDetails?.length || 0;
  const ineligibleCount = payrollDetails?.filter((e) => !e.is_eligible).length || 0;
  console.log(ineligibleCount)

  // Show loading state while updating status
  if (isUpdatingStatus) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 text-[#7F5EFD] animate-spin" />
          <p className="text-sm text-slate-500">Preparing payroll for review...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-375 mx-auto py-6 px-4">
      {/* Header */}
      {payroll && (
        <ReviewHeader
          payroll={payroll}
          canRecalculate={canRecalculate}
          canApprove={canApprove}
          isFullyApproved={isFullyApproved}
          onRecalculate={handleRecalculate}
          onCancel={handleCancelPayrollRun}
          onApprove={handleApprovePayrollRun}
          onRevert={handleRevertPayrollRun}
          isRecalculating={recalculate.isPending}
          isCancelling={cancelRun.isPending}
          isApproving={isApproving || approveRun.isPending}
          isReverting={revertRun.isPending}
        />
      )}

      {/* Main Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_290px] gap-5">
        {/* Employee Table */}
        <div className="min-w-0">
          <Card className="border-slate-200 shadow-none rounded-sm overflow-hidden">
            <EmployeeTable
              employees={payrollDetails || []}
              isLoading={detailsLoading}
              onRefresh={() => {
                refetchStatus();
                refetchDetails();
                toast.info('Refreshing payroll data...');
              }}
              onApproveSelected={handleBulkApprove}
              onApproveAll={handleApproveAll}
              onUpdateReview={handleUpdateReview}
              isUpdating={updateReview.isPending || bulkUpdate.isPending}
              isApproved={isApproved}
            />
          </Card>
        </div>

        {/* Sidebar */}
        <Sidebar
          reviewStatus={reviewStatus || null}
          totalGross={totalGross}
          totalNet={totalNet}
          totalDeductions={totalDeductions}
          totalAllowances={totalAllowances}
          totalEmployees={totalEmployees}
          ineligibleCount={ineligibleCount}
          reviewers={reviewStatus?.steps || []}
          isLoading={statusLoading}
        />
      </div>
    </div>
  );
}