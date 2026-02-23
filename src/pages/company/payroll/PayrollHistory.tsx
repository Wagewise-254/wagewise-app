// src/pages/company/payroll/PayrollHistory.tsx

import { useState, useEffect, useMemo, useCallback } from "react";
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
  Filter,
  Calendar,
  ArrowLeft,
  //Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/authStore";
import { API_BASE_URL } from "@/config";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Types
type PayrollStatus = "DRAFT" | "UNDER_REVIEW" | "APPROVED" | "PAID";

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
}

interface PayrollFilters {
  status: PayrollStatus | "all";
  year: number | "all";
  search: string;
}

// Constants
const PAGE_SIZE = 10;

const STATUS_OPTIONS: { value: PayrollStatus | "all"; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "APPROVED", label: "Approved" },
  { value: "PAID", label: "Paid" },
];

// Utility functions
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
    PAID: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
    },
  };
  return variants[status] || variants.DRAFT;
};

// Components
const EmptyState = () => (
  <TableRow>
    <TableCell colSpan={6} className="h-64 text-center">
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
        <TableCell colSpan={6} className="py-4">
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

  // State
  const [payrolls, setPayrolls] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<PayrollFilters>({
    status: "all",
    year: "all",
    search: "",
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
  });
  const [searchInput, setSearchInput] = useState("");

  // Memoized values
  const availableYears = useMemo(() => {
    const years = payrolls.map((p) => p.payroll_year);
    return [...new Set(years)].sort((a, b) => b - a);
  }, [payrolls]);

  // API calls
  const fetchPayrolls = useCallback(async () => {
    if (!companyId || !token) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: PAGE_SIZE.toString(),
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

      setPayrolls(Array.isArray(data) ? data : data.data || []);
      setPagination((prev) => ({
        ...prev,
        totalPages:
          data.totalPages ||
          Math.ceil((Array.isArray(data) ? data.length : 0) / PAGE_SIZE) ||
          1,
        totalItems: data.totalItems || (Array.isArray(data) ? data.length : 0),
      }));
    } catch (error) {
      console.error("Failed to fetch payrolls:", error);
      toast.error("Failed to load payroll history. Please try again.");
      setPayrolls([]);
    } finally {
      setLoading(false);
    }
  }, [companyId, token, pagination.currentPage, filters]);

  useEffect(() => {
    fetchPayrolls();
  }, [fetchPayrolls]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        setFilters((prev) => ({ ...prev, search: searchInput }));
        setPagination((prev) => ({ ...prev, currentPage: 1 }));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput, filters.search]);

  const handleStatusUpdate = async (
    runId: string,
    newStatus: PayrollStatus,
  ) => {
    if (!companyId || !token) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/company/${companyId}/payroll/${runId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        },
      );

      if (!response.ok) {
        throw new Error("Update failed");
      }

      toast.success(
        `Payroll status updated to ${newStatus.toLowerCase().replace("_", " ")}`,
      );
      fetchPayrolls();
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update payroll status. Please try again.");
    }
  };

  // Event handlers
  const clearSearch = () => {
    setSearchInput("");
    setFilters((prev) => ({ ...prev, search: "" }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const clearFilters = () => {
    setFilters({ status: "all", year: "all", search: "" });
    setSearchInput("");
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

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, currentPage: newPage }));
    // Scroll to top of table
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRowClick = (payrollId: string) => {
    navigate(`/company/${companyId}/payroll/${payrollId}/review-status`);
  };

  const handleViewDetails = (e: React.MouseEvent, payrollId: string) => {
    e.stopPropagation();
    navigate(`/company/${companyId}/payroll/${payrollId}/review-status`);
  };

  const handleStatusAction = async (
    e: React.MouseEvent,
    runId: string,
    newStatus: PayrollStatus,
  ) => {
    e.stopPropagation();
    await handleStatusUpdate(runId, newStatus);
  };

  const handleRunNewPayroll = () => {
    navigate(`/company/${companyId}/payroll/run`);
  };

  // Count active filters
  const activeFilterCount = [
    filters.status !== "all" ? 1 : 0,
    filters.year !== "all" ? 1 : 0,
    filters.search ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6 mt-2  md:p-2 lg:p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex ">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 cursor-pointer"
                onClick={() => navigate(`/company/${companyId}/modules`)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Back to modules</p>
            </TooltipContent>
          </Tooltip>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Payroll History
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              View and manage all payroll runs
            </p>
          </div>
        </div>
        <Button
          onClick={handleRunNewPayroll}
          className="bg-[#1F3A8A] hover:bg-[#162a63] cursor-pointer rounded-md h-10 px-4 text-sm font-medium transition-all hover:-translate-y-0.5 w-full sm:w-auto"
        >
          <DollarSign className="mr-2 h-4 w-4" />
          Run New Payroll
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="border-slate-300 rounded-sm shadow-none overflow-hidden">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by payroll number or period..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 pr-10 h-10 bg-white border-slate-300 rounded-sm shadow-none focus-visible:ring-1 focus-visible:ring-[#1F3A8A] focus-visible:border-[#1F3A8A]"
                aria-label="Search payrolls"
              />
              {searchInput && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={filters.status} onValueChange={handleStatusFilter}>
                <SelectTrigger className="w-35 h-10 border-slate-300 rounded-sm shadow-none focus-visible:ring-1 focus-visible:ring-[#1F3A8A]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {availableYears.length > 0 && (
                <Select
                  value={filters.year.toString()}
                  onValueChange={handleYearFilter}
                >
                  <SelectTrigger className="w-30 h-10 border-slate-300 rounded-sm shadow-none focus-visible:ring-1 focus-visible:ring-[#1F3A8A]">
                    <Calendar className="h-4 w-4 mr-2 text-slate-400" />
                    <SelectValue placeholder="Filter by year" />
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
              )}

              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-10 px-3 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Clear Filters ({activeFilterCount})
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card className="border-slate-300 rounded-sm shadow-none overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="hover:bg-transparent border-b border-slate-200">
                <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider py-4 pl-6">
                  Period
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Payroll #
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">
                  Gross Pay
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">
                  Net Pay
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Status
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider text-center pr-6">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <LoadingState />
              ) : payrolls.length > 0 ? (
                payrolls.map((run) => {
                  const statusStyle = getStatusBadgeVariant(run.status);
                  return (
                    <TableRow
                      key={run.id}
                      className="cursor-pointer hover:bg-slate-50/80 transition-colors border-b border-slate-100 group"
                      onClick={() => handleRowClick(run.id)}
                    >
                      <TableCell className="py-4 pl-6">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">
                            {run.payroll_month} {run.payroll_year}
                          </span>
                          <span className="text-xs text-slate-500">
                            {new Date(run.created_at).toLocaleDateString(
                              "en-KE",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded-md text-slate-700">
                          {run.payroll_number}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-slate-700">
                        {formatCurrency(run.total_gross_pay)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold text-slate-900">
                        {formatCurrency(run.total_net_pay)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border",
                            statusStyle.bg,
                            statusStyle.text,
                            statusStyle.border,
                          )}
                        >
                          {run.status.replace("_", " ")}
                        </span>
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
                              className="h-8 w-8 opacity-70 group-hover:opacity-100 hover:bg-slate-100"
                            >
                              <MoreVertical className="h-4 w-4 text-slate-600" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-56 rounded-lg border-slate-200"
                          >
                            <DropdownMenuLabel className="text-xs font-medium text-slate-500">
                              Actions
                            </DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={(e) => handleViewDetails(e, run.id)}
                              className="cursor-pointer"
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            {run.status === "DRAFT" && (
                              <DropdownMenuItem
                                onClick={(e) =>
                                  handleStatusAction(e, run.id, "UNDER_REVIEW")
                                }
                                className="cursor-pointer text-amber-600 focus:text-amber-600"
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Submit for Review
                              </DropdownMenuItem>
                            )}

                            {run.status === "UNDER_REVIEW" && (
                              <DropdownMenuItem
                                onClick={(e) =>
                                  handleStatusAction(e, run.id, "APPROVED")
                                }
                                className="cursor-pointer text-emerald-600 focus:text-emerald-600"
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approve Payroll
                              </DropdownMenuItem>
                            )}

                            {run.status === "APPROVED" && (
                              <DropdownMenuItem
                                onClick={(e) =>
                                  handleStatusAction(e, run.id, "PAID")
                                }
                                className="cursor-pointer text-blue-600 focus:text-blue-600"
                              >
                                <DollarSign className="mr-2 h-4 w-4" />
                                Mark as Paid
                              </DropdownMenuItem>
                            )}

                            {run.status === "PAID" && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toast.info("Download feature coming soon");
                                }}
                                className="cursor-pointer"
                              >
                                <Download className="mr-2 h-4 w-4" />
                                Download Payslips
                              </DropdownMenuItem>
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
          <div className="px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 bg-slate-50/50">
            <p className="text-sm text-slate-600 order-2 sm:order-1">
              Showing{" "}
              <span className="font-medium">
                {(pagination.currentPage - 1) * PAGE_SIZE + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium">
                {Math.min(
                  pagination.currentPage * PAGE_SIZE,
                  pagination.totalItems,
                )}
              </span>{" "}
              of <span className="font-medium">{pagination.totalItems}</span>{" "}
              results
            </p>

            <div className="flex items-center gap-2 order-1 sm:order-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(1)}
                disabled={pagination.currentPage === 1}
                className="hidden sm:flex border-slate-200 hover:bg-slate-100"
              >
                <ChevronsLeft className="h-4 w-4" />
                <span className="sr-only">First page</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="border-slate-200 hover:bg-slate-100"
              >
                <ChevronLeft className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Previous</span>
              </Button>

              <span className="text-sm px-4 py-2 bg-white border border-slate-200 rounded-md font-medium">
                {pagination.currentPage}
                <span className="text-slate-400 mx-1">/</span>
                {pagination.totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="border-slate-200 hover:bg-slate-100"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="h-4 w-4 sm:ml-1" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.totalPages)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="hidden sm:flex border-slate-200 hover:bg-slate-100"
              >
                <ChevronsRight className="h-4 w-4" />
                <span className="sr-only">Last page</span>
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
