// src/pages/company/payroll/PayrollHubPage.tsx

import { useState } from 'react';
import { useParams, Link, useNavigate} from 'react-router-dom';
import { toast } from 'sonner';
import {
  useReviewStatus,
  usePayrollDetails,
  useApprovePayrollRun,
  useRevertPayrollRun,
} from '@/pages/company/payroll/reviews/hooks/usePayrollReview';
import {
  Users,
  Receipt,
  FileText,
  ChevronRight,
  Lock,
  CheckCircle2,
  Clock3,
  AlertCircle,
  WalletCards,
  Calculator,
  SlidersHorizontal,
  ArrowUpRight,
  RotateCcw,
  RefreshCw,
  MoreVertical
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from "@/lib/utils";
import { PAYROLL_STATUS } from '@/lib/constants';

// -----------------------------------------------------------------------------
// Components
// -----------------------------------------------------------------------------

function SectionLink({
  icon: Icon,
  title,
  description,
  href = "#",
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  href?: string;
}) {
  return (
    <Link
      to={href}
      className="group flex items-center gap-3 border border-slate-200 p-4 rounded-sm hover:border-slate-300 hover:bg-slate-50/60 transition-colors"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-slate-200 bg-white rounded-sm">
        <Icon className="h-4 w-4 text-slate-600" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-900">{title}</p>
        <p className="mt-0.5 text-xs text-slate-500">{description}</p>
      </div>

      <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

// -----------------------------------------------------------------------------
// Main Page
// -----------------------------------------------------------------------------

export default function PayrollHubPage() {
  const { companyId, payrollRunId } = useParams<{ companyId: string; payrollRunId: string }>();
  const navigate = useNavigate();
  //console.log(`companyId: ${companyId}, payrollRunId: ${payrollRunId}`);  

  // State for dialogs
  const [showLockDialog, setShowLockDialog] = useState(false);
  const [showPaidDialog, setShowPaidDialog] = useState(false);
  const [showRevertDialog, setShowRevertDialog] = useState(false);
  const [isLocking, setIsLocking] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isReverting, setIsReverting] = useState(false);

  // Use existing hooks from review
  const {
    data: reviewStatus,
    isLoading: statusLoading,
    refetch: refetchStatus,
  } = useReviewStatus(companyId!, payrollRunId!);

  const {
    data: payrollDetails,
    isLoading: detailsLoading,
    refetch: refetchDetails,
  } = usePayrollDetails(companyId!, payrollRunId!);


  // Mutations from review
  const approveRun = useApprovePayrollRun(companyId!, payrollRunId!);
  const revertRun = useRevertPayrollRun(companyId!, payrollRunId!);

  // Get data from review status
  const payroll = reviewStatus?.payroll;
  const currentStatus = payroll?.status;
  const isApproved = currentStatus === PAYROLL_STATUS.APPROVED;
  const isLocked = currentStatus === PAYROLL_STATUS.LOCKED;
  const isPaid = currentStatus === PAYROLL_STATUS.PAID;
  const isUnderReview = currentStatus === PAYROLL_STATUS.UNDER_REVIEW;
  const isDraft = currentStatus === PAYROLL_STATUS.DRAFT;
  const isPrepared = currentStatus === PAYROLL_STATUS.PREPARED;
  const isCancelled = currentStatus === PAYROLL_STATUS.CANCELLED;

  //console.log(`payroll: ${payroll}`)

  // Calculate totals from payroll details
  const totalGross = payrollDetails?.reduce((sum, e) => sum + (e.gross_pay || 0), 0) || 0;
  const totalNet = payrollDetails?.reduce((sum, e) => sum + (e.net_pay || 0), 0) || 0;
  const totalDeductions = payrollDetails?.reduce((sum, e) => sum + (e.total_deductions || 0), 0) || 0;
  const totalAllowances = payrollDetails?.reduce((sum, e) => sum + (e.total_allowances || 0), 0) || 0;
  const totalEmployees = payrollDetails?.filter((e) => e.is_eligible).length || 0;

  // Calculate payslip stats from payroll details
  const payslipStats = {
    total: totalEmployees,
    generated: payrollDetails?.filter(e => e.net_pay > 0).length || 0,
    sent: payrollDetails?.filter(e => e.payslip_sent_at).length || 0,
    viewed: Math.floor((payrollDetails?.filter(e => e.net_pay > 0).length || 0) * 0.8), // Mock viewed count
  };

  // Report stats - fixed at 11 reports
  const reportStats = {
    total: 11,
    ready: payroll?.status === PAYROLL_STATUS.LOCKED || payroll?.status === PAYROLL_STATUS.PAID ? 11 : 0,
  };

  // Get reviewers count
  const reviewers = reviewStatus?.steps || [];
  const completedReviewers = reviewers.filter(r => r.is_completed).length;

  // Get payroll summary for display
  const payrollSummary = {
    id: payroll?.payroll_number || 'PR-000001',
    period: payroll ? `${payroll.payroll_month} ${payroll.payroll_year}` : 'N/A',
    status: currentStatus?.toLowerCase() as 'draft' | 'under_review' | 'approved' | 'locked' || 'draft',
    employees: totalEmployees,
    gross: totalGross,
    deductions: totalDeductions,
    allowances: totalAllowances,
    net: totalNet,
    review: {
      reviewers: reviewers.length,
      completed: completedReviewers,
      reviewedBy: reviewers.find(r => r.is_completed)?.reviewer_name || 'Pending',
      //approvedBy: payroll?.approved_at ? 'System' : 'Pending',
      approvedBy: reviewers.find(r => r.is_completed)?.reviewer_name || 'Pending',
      approvedDate: payroll?.approved_at ? new Date(payroll.approved_at).toLocaleDateString('en-US', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      }) : 'N/A',
    },
    payslips: payslipStats,
    reports: reportStats,
    payment: {
      status: isPaid ? 'Paid' : isLocked ? 'Ready for Payment' : 'Scheduled',
      date: payroll?.paid_at ? new Date(payroll.paid_at).toLocaleDateString('en-US', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      }) : 'Pending',
    },
  };

  // Status configuration
  const statusConfig = {
    draft: {
      label: "Draft",
      icon: AlertCircle,
      className: "border-slate-200 bg-slate-50 text-slate-700",
    },
    under_review: {
      label: "Under Review",
      icon: Clock3,
      className: "border-amber-200 bg-amber-50 text-amber-700",
    },
    approved: {
      label: "Approved",
      icon: CheckCircle2,
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    locked: {
      label: "Locked",
      icon: Lock,
      className: "border-slate-200 bg-slate-100 text-slate-700",
    },
  };

  const status = statusConfig[payrollSummary.status as keyof typeof statusConfig] || statusConfig.draft;
  const StatusIcon = status.icon;

  // Check if we should show the review card instead of the hub
  const showReviewCard = isUnderReview || isDraft || isPrepared || isCancelled;

  // Handlers
  const handleLockPayroll = async () => {
    setIsLocking(true);
    try {
      await approveRun.mutateAsync();
      toast.success('Payroll locked successfully');
      await refetchStatus();
      await refetchDetails();
      setShowLockDialog(false);
    } catch (error) {
      toast.error('Failed to lock payroll');
    } finally {
      setIsLocking(false);
    }
  };

  const handleMarkAsPaid = async () => {
    setIsPaying(true);
    try {
      // Call the approve endpoint which transitions to PAID
      // You might need a separate endpoint for this
      const response = await fetch(`/api/company/${companyId}/payroll/runs/${payrollRunId}/mark-paid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to mark as paid');
      toast.success('Payroll marked as paid successfully');
      await refetchStatus();
      await refetchDetails();
      setShowPaidDialog(false);
    } catch (error) {
      toast.error('Failed to mark as paid');
    } finally {
      setIsPaying(false);
    }
  };

  const handleRevert = async () => {
    setIsReverting(true);
    try {
      await revertRun.mutateAsync();
      toast.success('Payroll reverted to under review');
      await refetchStatus();
      await refetchDetails();
      setShowRevertDialog(false);
    } catch (error) {
      toast.error('Failed to revert payroll');
    } finally {
      setIsReverting(false);
    }
  };

  const formatCurrency = (amount: number) => `KES ${amount.toLocaleString()}`;

  // Loading state
  if (statusLoading || detailsLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex items-center justify-center min-h-64">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="h-8 w-8 text-[#7F5EFD] animate-spin" />
            <p className="text-sm text-slate-500">Loading payroll hub...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show review card for non-approved/locked/paid statuses
  if (showReviewCard) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold tracking-tight text-slate-900">
                Payroll Hub
              </h1>
              <Badge
                variant="outline"
                className={cn(
                  "rounded-sm px-2 py-0.5 text-xs font-medium",
                  status.className
                )}
              >
                <StatusIcon className="mr-1.5 h-3 w-3" />
                {status.label}
              </Badge>
            </div>
            <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500">
              <span>{payrollSummary.id}</span>
              <span className="text-slate-300">•</span>
              <span>{payrollSummary.period}</span>
            </div>
          </div>
        </div>

        <Card className="rounded-sm border-slate-200 shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 mb-4">
              <Clock3 className="h-8 w-8 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Payroll is {status.label.toLowerCase()}
            </h3>
            <p className="text-sm text-slate-500 text-center max-w-md mb-6">
              {isCancelled 
                ? 'This payroll has been cancelled and cannot be modified.'
                : 'This payroll is currently being reviewed. You can view the progress and approve individual employees in the review page.'}
            </p>
            <Link to={`/company/${companyId}/payroll/${payrollRunId}/review-status`}>
              <Button className="bg-[#7F5EFD] hover:bg-[#6b4de0] text-white">
                Go to Review Page
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main hub view for approved/locked/paid statuses
  const payslipSentPercentage = Math.round(
    (payrollSummary.payslips.sent / payrollSummary.payslips.total) * 100
  ) || 0;


  const canLock = isApproved && !isLocked && !isPaid;
  const canMarkPaid = isLocked && !isPaid;
  const canRevert = isApproved || isLocked || isPaid;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                             */}
      {/* ------------------------------------------------------------------ */}

      <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">
              Payroll Hub
            </h1>

            <Badge
              variant="outline"
              className={cn(
                "rounded-sm px-2 py-0.5 text-xs font-medium",
                status.className
              )}
            >
              <StatusIcon className="mr-1.5 h-3 w-3" />
              {status.label}
            </Badge>
          </div>

          <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500">
            <span>{payrollSummary.id}</span>
            <span className="text-slate-300">•</span>
            <span>{payrollSummary.period}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canLock && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-sm border-slate-200"
              onClick={() => setShowLockDialog(true)}
              disabled={isLocking}
            >
              <Lock className="mr-2 h-3.5 w-3.5" />
              {isLocking ? 'Locking...' : 'Lock Payroll'}
            </Button>
          )}

          {canMarkPaid && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-sm border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              onClick={() => setShowPaidDialog(true)}
              disabled={isPaying}
            >
              <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
              {isPaying ? 'Processing...' : 'Mark as Paid'}
            </Button>
          )}

          {canRevert && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-sm border-slate-200"
                >
                  <MoreVertical className="mr-2 h-3.5 w-3.5" />
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setShowRevertDialog(true)}
                  disabled={isReverting}
                  className="cursor-pointer text-amber-600 focus:text-amber-600"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  {isReverting ? 'Reverting...' : 'Revert to Review'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Payroll Overview                                                    */}
      {/* ------------------------------------------------------------------ */}

      <div className="mb-6 grid grid-cols-2 gap-px overflow-hidden border border-slate-200 bg-slate-200 sm:grid-cols-4">
        <div className="bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Employees</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">
            {payrollSummary.employees}
          </p>
        </div>

        <div className="bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Gross Payroll</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">
            {formatCurrency(payrollSummary.gross)}
          </p>
        </div>

        <div className="bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Deductions</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">
            {formatCurrency(payrollSummary.deductions)}
          </p>
        </div>

        <div className="bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Net Payroll</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">
            {formatCurrency(payrollSummary.net)}
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Main Grid                                                           */}
      {/* ------------------------------------------------------------------ */}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Left side */}
        <div className="space-y-5">
          {/* Review & Approval */}
          <Card className="rounded-sm border-slate-200 shadow-none">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold text-slate-900">
                    Review & Approval
                  </CardTitle>
                  <p className="mt-1 text-xs text-slate-500">
                    Payroll approval workflow
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={cn("rounded-sm text-[11px]", status.className)}
                >
                  {status.label}
                </Badge>
              </div>
            </CardHeader>

            <CardContent>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-slate-200 bg-slate-50">
                    <CheckCircle2 className="h-4 w-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {payrollSummary.review.completed} of{" "}
                      {payrollSummary.review.reviewers} reviewers completed
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {isPaid 
                        ? "Payroll has been paid." 
                        : isLocked 
                          ? "Payroll is locked and ready for payment." 
                          : "Payroll has been approved."}
                    </p>
                  </div>
                </div>

                <Link to={`/company/${companyId}/payroll/${payrollRunId}/review-status`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-sm border-slate-200"
                  >
                    Review Payroll
                    <ChevronRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>

              <Separator className="my-4" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500">Approved By</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {payrollSummary.review.approvedBy}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Approved On</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {payrollSummary.review.approvedDate}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payroll Data */}
          <Card className="rounded-sm border-slate-200 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-900">
                Payroll Data
              </CardTitle>
              <p className="text-xs text-slate-500">
                Manage the data used for this payroll run.
              </p>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <SectionLink
                  icon={Users}
                  title="Employees"
                  description={`${payrollSummary.employees} employees included`}
                  href={`/company/${companyId}/payroll/${payrollRunId}/employees/included`}
                />

                <SectionLink
                  icon={Calculator}
                  title="Allowances"
                  description="Review payroll allowances"
                  href={`/company/${companyId}/payroll/${payrollRunId}/hub/allowances`}
                />

                <SectionLink
                  icon={SlidersHorizontal}
                  title="Deductions"
                  description="Review payroll deductions"
                  href={`/company/${companyId}/payroll/${payrollRunId}/hub/deductions`}
                />
              </div>
            </CardContent>
          </Card>

          {/* Payslips */}
          <Card className="rounded-sm border-slate-200 shadow-none">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold text-slate-900">
                    Payslips
                  </CardTitle>
                  <p className="mt-1 text-xs text-slate-500">
                    Distribution overview for this payroll.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/company/${companyId}/payroll/${payrollRunId}/payslips`)}
                  className="h-8 rounded-sm px-2 text-xs text-slate-600"
                >
                  View Payslips
                  <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-slate-500">Generated</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {payrollSummary.payslips.generated}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    of {payrollSummary.payslips.total}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Sent</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {payrollSummary.payslips.sent}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {payslipSentPercentage}% distributed
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reports */}
          <Card className="rounded-sm border-slate-200 shadow-none">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold text-slate-900">
                    Reports
                  </CardTitle>
                  <p className="mt-1 text-xs text-slate-500">
                    Payroll and statutory reporting.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/company/${companyId}/payroll/${payrollRunId}/reports`)}
                  className="h-8 rounded-sm px-2 text-xs text-slate-600"
                >
                  View Reports
                  <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="flex items-center justify-between border border-slate-200 bg-slate-50/50 p-3 rounded-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-sm border border-slate-200 bg-white">
                    <FileText className="h-4 w-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Reports Ready
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      payroll and statutory
                      reports available
                    </p>
                  </div>
                </div>
                {payrollSummary.reports.ready === payrollSummary.reports.total ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Clock3 className="h-4 w-4 text-amber-600" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right side */}
        <div className="space-y-5">
          {/* Payroll State */}
          <Card className="rounded-sm border-slate-200 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-900">
                Payroll Status
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div
                className={cn(
                  "flex items-start gap-3 border p-3 rounded-sm",
                  status.className
                )}
              >
                <StatusIcon className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="text-sm font-medium">{status.label}</p>
                  <p className="mt-1 text-xs opacity-80">
                    {isPaid 
                      ? "Payroll has been paid and finalized." 
                      : isLocked 
                        ? "Payroll is locked and ready for payment." 
                        : "Payroll has been approved and is ready to be locked."}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Payroll ID</span>
                  <span className="font-medium text-slate-900">
                    {payrollSummary.id}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Pay Period</span>
                  <span className="font-medium text-slate-900">
                    {payrollSummary.period}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Employees</span>
                  <span className="font-medium text-slate-900">
                    {payrollSummary.employees}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Payment Status</span>
                  <span className="font-medium text-slate-900">
                    {payrollSummary.payment.status}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card className="rounded-sm border-slate-200 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-900">
                Payment Methods
              </CardTitle>
              <p className="mt-1 text-xs text-slate-500">
                Payment accounts configured for payroll.
              </p>
            </CardHeader>

            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-sm border border-slate-200 bg-slate-50">
                    <WalletCards className="h-4 w-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                       Payment Methods
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Configured for payroll payments
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/company/${companyId}/payroll/${payrollRunId}/payment-methods`)}
                  className="h-8 rounded-sm px-2 text-xs text-slate-600"
                >
                  View
                  <ChevronRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* More */}
          <Card className="rounded-sm border-slate-200 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-900">
                Payroll Management
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-2">
              <SectionLink
                icon={Receipt}
                title="Payslip Management"
                description="Generate and distribute payslips"
                href={`/company/${companyId}/payroll/${payrollRunId}/payslips`}
              />

              <SectionLink
                icon={FileText}
                title="Payroll Reports"
                description="View and export payroll reports"
                href={`/company/${companyId}/payroll/${payrollRunId}/reports`}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <AlertDialog open={showLockDialog} onOpenChange={setShowLockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lock Payroll</AlertDialogTitle>
            <AlertDialogDescription>
              This will lock the payroll run, preventing any further changes. 
              Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLockPayroll}
              className="bg-slate-700 hover:bg-slate-800"
              disabled={isLocking}
            >
              {isLocking ? 'Locking...' : 'Lock Payroll'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showPaidDialog} onOpenChange={setShowPaidDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as Paid</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the payroll as paid. This action will finalize the 
              payroll run and cannot be undone without reverting. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMarkAsPaid}
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={isPaying}
            >
              {isPaying ? 'Processing...' : 'Mark as Paid'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showRevertDialog} onOpenChange={setShowRevertDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revert to Review</AlertDialogTitle>
            <AlertDialogDescription>
              This will revert the payroll run back to "Under Review" status. 
              All approvals will be reset. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevert}
              className="bg-amber-600 hover:bg-amber-700"
              disabled={isReverting}
            >
              {isReverting ? 'Reverting...' : 'Revert to Review'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}