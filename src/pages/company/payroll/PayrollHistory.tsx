// src/pages/company/payroll/PayrollHistory.tsx

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  MoreVertical,
  Eye,
  Download,
  CheckCircle,
  FileText,
  DollarSign,
  X,
  Calendar,
  Loader2,
  Lock,
  RefreshCw,
  Unlock,
  Edit2,
  History,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuthStore } from "@/stores/authStore";
import { API_BASE_URL } from "@/config";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ReviewProgress } from "@/components/payroll/runs/ReviewProgress";

// Types
type PayrollStatus =
  | "DRAFT"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "LOCKED"
  | "PAID"
  | "REJECTED"
  | "CANCELLED";

interface PayrollRun {
  id: string;
  payroll_number: string;
  payroll_month: string;
  payroll_year: number;
  total_gross_pay: number;
  total_net_pay: number;
  status: PayrollStatus;
  created_at: string;
  updated_at: string;
  review_stats?: {
    total_employees: number;
    approved: number;
    pending: number;
    rejected: number;
    completion_percentage: number;
    all_approved?: boolean;
    any_rejected?: boolean;
  };
}

interface PayrollFilters {
  status: PayrollStatus | "all";
  year: number | "all";
  search: string;
}

interface RevertDialogState {
  open: boolean;
  targetStatus: PayrollStatus | null;
  currentStatus: PayrollStatus | null;
  runId: string | null;
}

interface StatusAction {
  label: string;
  targetStatus: PayrollStatus;
  icon: React.ElementType;
  color: string;
  requireReason?: boolean;
}

const getAvailableActions = (status: PayrollStatus): StatusAction[] => {
  const actions: Record<PayrollStatus, StatusAction[]> = {
    DRAFT: [
      {
        label: "Submit for Review",
        targetStatus: "UNDER_REVIEW",
        icon: CheckCircle,
        color: "text-amber-600",
      },
    ],
    UNDER_REVIEW: [
      {
        label: "Approve",
        targetStatus: "APPROVED",
        icon: CheckCircle,
        color: "text-emerald-600",
      },
      {
        label: "Reject",
        targetStatus: "REJECTED",
        icon: X,
        color: "text-red-600",
        requireReason: true,
      },
      {
        label: "Revert to Draft",
        targetStatus: "DRAFT",
        icon: RefreshCw,
        color: "text-slate-600",
        requireReason: true,
      },
    ],
    APPROVED: [
      {
        label: "Lock Payroll",
        targetStatus: "LOCKED",
        icon: Lock,
        color: "text-blue-600",
      },
      {
        label: "Revert to Draft",
        targetStatus: "DRAFT",
        icon: RefreshCw,
        color: "text-slate-600",
        requireReason: true,
      },
      {
        label: "Revert to Review",
        targetStatus: "UNDER_REVIEW",
        icon: RefreshCw,
        color: "text-amber-600",
        requireReason: true,
      },
    ],
    LOCKED: [
      {
        label: "Mark as Paid",
        targetStatus: "PAID",
        icon: DollarSign,
        color: "text-green-600",
      },
      {
        label: "Unlock",
        targetStatus: "APPROVED",
        icon: Unlock,
        color: "text-orange-600",
        requireReason: true,
      },
    ],
    PAID: [
      {
        label: "View Payslips",
        targetStatus: "PAID",
        icon: Download,
        color: "text-slate-600",
      },
    ],
    REJECTED: [
      {
        label: "Revert to Draft",
        targetStatus: "DRAFT",
        icon: RefreshCw,
        color: "text-slate-600",
        requireReason: true,
      },
    ],
    CANCELLED: [],
  };

  return actions[status] || [];
};

const RevertDialog = ({
  open,
  onOpenChange,
  onConfirm,
  currentStatus,
  targetStatus,
  loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  currentStatus: string | null;
  targetStatus: string | null;
  loading: boolean;
}) => {
  const [reason, setReason] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-lg">
        <DialogHeader>
          <DialogTitle>Revert Payroll Status</DialogTitle>
          <DialogDescription>
            Are you sure you want to revert from {currentStatus} to{" "}
            {targetStatus}? This action will be recorded in audit logs.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for revert (required)</Label>
            <Textarea
              id="reason"
              placeholder="Explain why you're reverting this payroll..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-24 rounded-md"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(reason)}
            disabled={!reason.trim() || loading}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Revert
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const STATUS_OPTIONS: { value: PayrollStatus | "all"; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "APPROVED", label: "Approved" },
  { value: "LOCKED", label: "Locked" },
  { value: "PAID", label: "Paid" },
  { value: "REJECTED", label: "Rejected" },
  { value: "CANCELLED", label: "Cancelled" },
];

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const getStatusBadgeVariant = (status: PayrollStatus) => {
  const variants: Record<
    PayrollStatus,
    { bg: string; text: string; border: string }
  > = {
    DRAFT: {
      bg: "bg-slate-50",
      text: "text-slate-700",
      border: "border-slate-200",
    },
    UNDER_REVIEW: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
    },
    APPROVED: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
    },
    LOCKED: {
      bg: "bg-purple-50",
      text: "text-purple-700",
      border: "border-purple-200",
    },
    PAID: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
    },
    REJECTED: {
      bg: "bg-red-50",
      text: "text-red-700",
      border: "border-red-200",
    },
    CANCELLED: {
      bg: "bg-gray-50",
      text: "text-gray-700",
      border: "border-gray-200",
    },
  };
  return variants[status] || variants.DRAFT;
};

const EmptyState = () => (
  <TableRow>
    <TableCell colSpan={7} className="h-64 text-center">
      <div className="flex flex-col items-center justify-center gap-3">
        <div className="bg-slate-100 p-3 rounded-full">
          <FileText className="h-6 w-6 text-slate-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-700">
            No payroll history found
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your filters or create a new payroll run
          </p>
        </div>
      </div>
    </TableCell>
  </TableRow>
);

const LoadingState = () => (
  <>
    {[...Array(5)].map((_, i) => (
      <TableRow key={i} className="border-b border-slate-100">
        <TableCell colSpan={7} className="py-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        </TableCell>
      </TableRow>
    ))}
  </>
);

export default function PayrollHistory() {
  const navigate = useNavigate();
  const { companyId } = useParams<{ companyId: string }>();
  const session = useAuthStore((state) => state.session);
  const token = session?.access_token;
  const hasFetchedReviews = useRef(false);

  // State
  const [payrolls, setPayrolls] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [filters, setFilters] = useState<PayrollFilters>({
    status: "all",
    year: "all",
    search: "",
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalPages: 0,
    totalItems: 0,
  });
  const [revertDialog, setRevertDialog] = useState<RevertDialogState>({
    open: false,
    targetStatus: null,
    currentStatus: null,
    runId: null,
  });
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  const fetchPayrolls = useCallback(async () => {
    if (!companyId || !token) return;

    setLoading(true);

    try {
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: pagination.pageSize.toString(),
        ...(filters.status !== "all" && { status: filters.status }),
        ...(filters.year !== "all" && { year: filters.year.toString() }),
        ...(filters.search && { search: filters.search }),
      });

      const response = await fetch(
        `${API_BASE_URL}/company/${companyId}/payroll/runs?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      let payrollData: PayrollRun[] = [];
      let totalItems = 0;
      let totalPages = 1;
      let years: number[] = [];

      if (Array.isArray(data)) {
        payrollData = data;
        totalItems = data.length;
        totalPages = Math.ceil(data.length / pagination.pageSize);
        years = [...new Set(data.map((run) => run.payroll_year))];
      } else {
        payrollData = data.data || [];
        totalItems = data.totalItems || payrollData.length;
        totalPages =
          data.totalPages || Math.ceil(totalItems / pagination.pageSize);
        years = data.availableYears || [];
      }

      setPayrolls(payrollData);
      setAvailableYears(years);
      setPagination((prev) => ({
        ...prev,
        totalPages,
        totalItems,
      }));

      hasFetchedReviews.current = false;
    } catch (error) {
      console.error("Failed to fetch payrolls:", error);
      toast.error("Failed to load payroll history. Please try again.");
      setPayrolls([]);
    } finally {
      setLoading(false);
    }
  }, [companyId, token, pagination.currentPage, pagination.pageSize, filters]);

  const fetchReviewSummaries = useCallback(
    async (runIds: string[], forceRefresh = false) => {
      if (!companyId || !token || runIds.length === 0) return;
      if (hasFetchedReviews.current && !forceRefresh) return;

      setReviewLoading(true);

      interface ReviewSummariesResponse {
        summaries: {
          [key: string]: {
            total_employees: number;
            approved: number;
            pending: number;
            rejected: number;
            completion_percentage: number;
            all_approved?: boolean;
            any_rejected?: boolean;
          };
        };
      }

      const BATCH_SIZE = 5;
      const batches = [];

      for (let i = 0; i < runIds.length; i += BATCH_SIZE) {
        batches.push(runIds.slice(i, i + BATCH_SIZE));
      }

      try {
        const allSummaries: ReviewSummariesResponse["summaries"] = {};

        for (const batch of batches) {
          const response = await fetch(
            `${API_BASE_URL}/company/${companyId}/payroll/review-summaries`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ runIds: batch }),
            },
          );

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.warn(
              `Failed to fetch batch: ${errorData.error || "Unknown error"}`,
            );
            continue;
          }

          const data = (await response.json()) as ReviewSummariesResponse;
          Object.assign(allSummaries, data.summaries);
        }

        setPayrolls((prev) =>
          prev.map((run) => ({
            ...run,
            review_stats: allSummaries[run.id] || {
              total_employees: 0,
              approved: 0,
              pending: 0,
              rejected: 0,
              completion_percentage: 0,
              all_approved: false,
              any_rejected: false,
            },
          })),
        );

        hasFetchedReviews.current = true;
      } catch (error) {
        console.error("Error fetching review summaries:", error);
        toast.error(
          "Failed to load review progress. You can click refresh to try again.",
        );
      } finally {
        setReviewLoading(false);
      }
    },
    [companyId, token],
  );

  const handleRefreshReviews = useCallback(() => {
    if (payrolls.length > 0) {
      hasFetchedReviews.current = false;
      fetchReviewSummaries(
        payrolls.map((r) => r.id),
        true,
      );
    }
  }, [payrolls, fetchReviewSummaries]);

  const runIds = useMemo(() => {
    return payrolls.map((r) => r.id);
  }, [payrolls]);

  useEffect(() => {
    if (payrolls.length > 0 && !hasFetchedReviews.current) {
      const timer = setTimeout(() => {
        fetchReviewSummaries(runIds);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [runIds, fetchReviewSummaries, payrolls.length]);

  useEffect(() => {
    fetchPayrolls();
  }, [fetchPayrolls]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== filters.search) {
        setFilters((prev) => ({ ...prev, search: searchValue }));
        setPagination((prev) => ({ ...prev, currentPage: 1 }));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchValue, filters.search]);

  const handleStatusUpdate = async (
    runId: string,
    newStatus: PayrollStatus,
    reason?: string,
  ) => {
    if (!companyId || !token) return;
    setActionLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/company/${companyId}/payroll/${runId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: newStatus,
            reason,
          }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Update failed");
      }

      toast.success(
        `Payroll ${newStatus.toLowerCase().replace("_", " ")} successfully`,
      );

      await fetchPayrolls();
      hasFetchedReviews.current = false;

      setRevertDialog({
        open: false,
        targetStatus: null,
        currentStatus: null,
        runId: null,
      });
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update payroll status",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleSyncRun = async (e: React.MouseEvent, runId: string) => {
    e.stopPropagation();

    const run = payrolls.find((r) => r.id === runId);
    if (!run) return;

    const blockedStatuses = ["APPROVED", "LOCKED", "PAID"];
    if (blockedStatuses.includes(run.status)) {
      toast.error(`Cannot resync payroll with status: ${run.status}`);
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/company/${companyId}/payroll/sync`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            month: run.payroll_month,
            year: run.payroll_year,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to resync payroll");
      }

      toast.success("Payroll resynchronized successfully");
      await fetchPayrolls();
      hasFetchedReviews.current = false;
    } catch (error) {
      console.error("Sync error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to resync payroll",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevertConfirm = async (reason: string) => {
    if (!revertDialog.runId || !revertDialog.targetStatus) return;
    await handleStatusUpdate(
      revertDialog.runId,
      revertDialog.targetStatus,
      reason,
    );
  };

  const clearFilters = () => {
    setFilters({ status: "all", year: "all", search: "" });
    setSearchValue("");
    setShowSearch(false);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleStatusFilter = (value: PayrollStatus | "all") => {
    setFilters((prev) => ({ ...prev, status: value }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleYearFilter = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      year: value === "all" ? "all" : parseInt(value, 10),
    }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handlePageSizeChange = (value: string) => {
    const newSize = parseInt(value, 10);
    setPagination((prev) => ({
      ...prev,
      pageSize: newSize,
      currentPage: 1,
    }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, currentPage: newPage }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRowClick = (payrollId: string) => {
    navigate(`/company/${companyId}/payroll/${payrollId}/review-status`);
  };

  const handleViewDetails = (e: React.MouseEvent, payrollId: string) => {
    e.stopPropagation();
    navigate(`/company/${companyId}/payroll/${payrollId}/review-status`);
  };

  const handleRunNewPayroll = () => {
    navigate(`/company/${companyId}/payroll/run`);
  };

  const activeFilterCount = [
    filters.status !== "all" ? 1 : 0,
    filters.year !== "all" ? 1 : 0,
    filters.search ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const startItem = (pagination.currentPage - 1) * pagination.pageSize + 1;
  const endItem = Math.min(
    pagination.currentPage * pagination.pageSize,
    pagination.totalItems,
  );

  return (
    <>
      {/* Revert Dialog */}
      <RevertDialog
        open={revertDialog.open}
        onOpenChange={(open) => setRevertDialog({ ...revertDialog, open })}
        onConfirm={handleRevertConfirm}
        currentStatus={revertDialog.currentStatus}
        targetStatus={revertDialog.targetStatus}
        loading={actionLoading}
      />
      {/* Main Card Container */}
      <Card className="rounded-sm shadow-none border-slate-200 overflow-hidden">
        <CardContent className="p-0">
          <div className="h-full flex flex-col p-6 ">
            {/* Header with minimalist toolbar */}
            <div className="shrink-0 flex items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5 text-slate-400" />
                  <h1 className="text-lg font-semibold text-slate-900">
                    Payroll History
                  </h1>
                </div>

                {/* Status Filter */}
                <Select
                  value={filters.status}
                  onValueChange={handleStatusFilter}
                >
                  <SelectTrigger className="h-8 w-36 text-sm border-slate-200 rounded-sm">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Year Filter */}
                <Select
                  value={filters.year.toString()}
                  onValueChange={handleYearFilter}
                >
                  <SelectTrigger className="h-8 w-28 text-sm border-slate-200 rounded-sm">
                    <Calendar className="h-3.5 w-3.5 mr-2 text-slate-400" />
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {availableYears.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Clear Filters Button */}
                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-8 px-2 text-xs text-slate-500 hover:text-slate-700"
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Clear ({activeFilterCount})
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-1">
                {/* Search with toggle */}
                <div className="relative">
                  {showSearch ? (
                    <div className="relative animate-in slide-in-from-left-2 fade-in duration-200">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <Input
                        placeholder="Search by payroll # or period..."
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        onBlur={() => {
                          if (!searchValue) setShowSearch(false);
                        }}
                        className="pl-8 h-8 w-64 text-sm bg-white border-slate-200 rounded-sm focus-visible:ring-1 focus-visible:ring-[#7F5EFD]"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowSearch(true)}
                          className="h-8 w-8 p-0 cursor-pointer"
                        >
                          <Search className="h-4 w-4 text-slate-500" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        Search payrolls
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>

                {/* Refresh Reviews Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRefreshReviews}
                      disabled={reviewLoading || payrolls.length === 0}
                      className="h-8 w-8 p-0 cursor-pointer"
                    >
                      <RefreshCw
                        className={`h-4 w-4 text-slate-500 ${
                          reviewLoading ? "animate-spin" : ""
                        }`}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    Refresh review progress
                  </TooltipContent>
                </Tooltip>

                {/* Run New Payroll Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleRunNewPayroll}
                      size="sm"
                      className="ml-2 h-8 text-xs rounded-sm cursor-pointer bg-[#7F5EFD] hover:bg-[#6a4ad3] shadow-none"
                    >
                      <DollarSign className="mr-1.5 h-3.5 w-3.5" /> Run Payroll
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    Create new payroll run
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Counter */}
            <div className="shrink-0 py-2">
              <p className="text-xs text-slate-400">
                {pagination.totalItems} payroll
                {pagination.totalItems !== 1 ? "s" : ""} found
              </p>
            </div>

            {/* Table Section */}
            <div className="flex-1 overflow-hidden mt-2">
              {loading ? (
                <div className="flex flex-col justify-center items-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                  <p className="text-slate-500 mt-2">
                    Loading payroll history...
                  </p>
                </div>
              ) : (
                <div className="h-full flex flex-col space-y-2">
                  {/* Table Container */}
                  <div className="flex-1 overflow-auto min-h-0 rounded-md border border-slate-200">
                    <Table className="relative">
                      <TableHeader className="sticky top-0 bg-slate-50 z-10 shadow-sm">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="h-8 text-xs font-medium text-slate-500 pl-6">
                            Period
                          </TableHead>
                          <TableHead className="h-8 text-xs font-medium text-slate-500">
                            Payroll #
                          </TableHead>
                          <TableHead className="h-8 text-xs font-medium text-slate-500 text-right">
                            Gross Pay
                          </TableHead>
                          <TableHead className="h-8 text-xs font-medium text-slate-500 text-right">
                            Net Pay
                          </TableHead>
                          <TableHead className="h-8 text-xs font-medium text-slate-500">
                            Status
                          </TableHead>
                          <TableHead className="h-8 text-xs font-medium text-slate-500 min-w-40">
                            Review Progress
                          </TableHead>
                          <TableHead className="h-8 text-xs font-medium text-slate-500 text-center pr-6">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <LoadingState />
                        ) : payrolls.length > 0 ? (
                          payrolls.map((run) => {
                            const statusStyle = getStatusBadgeVariant(
                              run.status,
                            );
                            return (
                              <TableRow
                                key={run.id}
                                className="cursor-pointer hover:bg-slate-50/80 transition-colors group"
                                onClick={() => handleRowClick(run.id)}
                              >
                                <TableCell className="py-3 pl-6">
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium text-slate-900">
                                      {run.payroll_month} {run.payroll_year}
                                    </span>
                                    <span className="text-xs text-slate-400">
                                      {new Date(
                                        run.created_at,
                                      ).toLocaleDateString("en-KE", {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                      })}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="font-mono text-xs bg-slate-50 px-2 py-1 rounded text-slate-600 border border-slate-200">
                                    {run.payroll_number}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right font-mono text-sm text-slate-600">
                                  {formatCurrency(run.total_gross_pay)}
                                </TableCell>
                                <TableCell className="text-right font-mono text-sm font-semibold text-slate-900">
                                  {formatCurrency(run.total_net_pay)}
                                </TableCell>
                                <TableCell>
                                  <span
                                    className={cn(
                                      "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border",
                                      statusStyle.bg,
                                      statusStyle.text,
                                      statusStyle.border,
                                    )}
                                  >
                                    {run.status.replace("_", " ")}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <ReviewProgress
                                    stats={
                                      run.review_stats || {
                                        total_employees: 0,
                                        approved: 0,
                                        pending: 0,
                                        rejected: 0,
                                        completion_percentage: 0,
                                      }
                                    }
                                  />
                                </TableCell>
                                <TableCell
                                  className="text-center pr-6"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <MoreVertical className="h-3.5 w-3.5 text-slate-500" />
                                        <span className="sr-only">
                                          Open menu
                                        </span>
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                      align="end"
                                      className="w-56 rounded-md border-slate-200"
                                    >
                                      <DropdownMenuLabel className="text-xs font-medium text-slate-500">
                                        Actions
                                      </DropdownMenuLabel>
                                      <DropdownMenuItem
                                        onClick={(e) =>
                                          handleViewDetails(e, run.id)
                                        }
                                        className="cursor-pointer text-sm"
                                      >
                                        <Eye className="mr-2 h-3.5 w-3.5" />
                                        View Details
                                      </DropdownMenuItem>

                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigate(
                                            `/company/${companyId}/payroll/eligibility?month=${run.payroll_month}&year=${run.payroll_year}&editMode=true`,
                                          );
                                        }}
                                        className="cursor-pointer text-sm"
                                        disabled={[
                                          "APPROVED",
                                          "LOCKED",
                                          "PAID",
                                        ].includes(run.status)}
                                      >
                                        <Edit2 className="mr-2 h-3.5 w-3.5" />
                                        Edit Eligibility
                                        {[
                                          "APPROVED",
                                          "LOCKED",
                                          "PAID",
                                        ].includes(run.status) && (
                                          <span className="ml-auto text-xs text-rose-500">
                                            Locked
                                          </span>
                                        )}
                                      </DropdownMenuItem>

                                      {run.status !== "PAID" && (
                                        <DropdownMenuItem
                                          onClick={(e) =>
                                            handleSyncRun(e, run.id)
                                          }
                                          className="cursor-pointer text-sm"
                                          disabled={[
                                            "APPROVED",
                                            "LOCKED",
                                            "PAID",
                                          ].includes(run.status)}
                                        >
                                          <RefreshCw className="mr-2 h-3.5 w-3.5" />
                                          Resync Payroll
                                          {[
                                            "APPROVED",
                                            "LOCKED",
                                            "PAID",
                                          ].includes(run.status) && (
                                            <span className="ml-auto text-xs text-rose-500">
                                              Locked
                                            </span>
                                          )}
                                        </DropdownMenuItem>
                                      )}

                                      <DropdownMenuSeparator />

                                      {getAvailableActions(run.status).map(
                                        (action) => (
                                          <DropdownMenuItem
                                            key={action.targetStatus}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (action.requireReason) {
                                                setRevertDialog({
                                                  open: true,
                                                  targetStatus:
                                                    action.targetStatus,
                                                  currentStatus: run.status,
                                                  runId: run.id,
                                                });
                                              } else {
                                                handleStatusUpdate(
                                                  run.id,
                                                  action.targetStatus,
                                                );
                                              }
                                            }}
                                            className={`cursor-pointer text-sm ${action.color}`}
                                          >
                                            <action.icon className="mr-2 h-3.5 w-3.5" />
                                            {action.label}
                                          </DropdownMenuItem>
                                        ),
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        ) : (
                          <EmptyState />
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {pagination.totalPages > 0 && (
                    <div className="shrink-0 flex items-center justify-between pt-2">
                      <p className="text-xs text-slate-400">
                        Showing {startItem} to {endItem} of{" "}
                        {pagination.totalItems} results
                      </p>
                      <div className="flex items-center space-x-2">
                        <Select
                          value={pagination.pageSize.toString()}
                          onValueChange={handlePageSizeChange}
                        >
                          <SelectTrigger className="h-7 w-16 text-xs border-slate-200 rounded-md">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PAGE_SIZE_OPTIONS.map((size) => (
                              <SelectItem key={size} value={size.toString()}>
                                {size}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex items-center gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePageChange(1)}
                            disabled={pagination.currentPage === 1}
                            className="h-7 w-7 p-0"
                          >
                            <ChevronsLeft className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              handlePageChange(pagination.currentPage - 1)
                            }
                            disabled={pagination.currentPage === 1}
                            className="h-7 w-7 p-0"
                          >
                            <ChevronLeft className="h-3.5 w-3.5" />
                          </Button>
                          <span className="text-xs text-slate-600 px-2">
                            Page {pagination.currentPage} of{" "}
                            {pagination.totalPages}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              handlePageChange(pagination.currentPage + 1)
                            }
                            disabled={
                              pagination.currentPage === pagination.totalPages
                            }
                            className="h-7 w-7 p-0"
                          >
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              handlePageChange(pagination.totalPages)
                            }
                            disabled={
                              pagination.currentPage === pagination.totalPages
                            }
                            className="h-7 w-7 p-0"
                          >
                            <ChevronsRight className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
