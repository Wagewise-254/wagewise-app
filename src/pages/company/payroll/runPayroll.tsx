// src/pages/company/payroll/RunPayroll.tsx

import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Loader2,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  FileText,
  Clock,
  ArrowUpRight,
  ArrowLeft,
  RefreshCw,
  Info,
  Users,
  Timer,
  Calendar,
  Construction,
  Ban,
  ShieldAlert,
  // Remove Users2 if not used
} from "lucide-react";
import { format, getYear } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
// Remove Alert imports if not used
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { API_BASE_URL } from "@/config";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

// [Interfaces]
interface PayrollRun {
  id: string;
  payroll_number: string;
  payroll_month: string;
  payroll_year: number;
  total_net_pay: number;
  employee_count?: number;
  status: string;
}

interface PayrollSummary {
  current_month: {
    exists: boolean;
    status?: string;
  };
  pending_approvals: number;
  yearly_total_gross: number;
  growth_percentage?: number;
}

// This is used in the component
/*
interface PayrollRunResponse {
  message: string;
  payrollRunId: string;
  isNewRun: boolean;
  totals: {
    totalGrossPay: number;
    totalStatutoryDeductions: number;
    totalPaye: number;
    totalNetPay: number;
    totalNSSF: number;
    totalSHIF: number;
    totalHousingLevy: number;
    totalHELB: number;
  };
}*/

// Define a proper type for API errors
interface ApiError {
  status: number;
  error?: {
    error?: string;
    message?: string;
    details?: string;
  };
}

const years = Array.from({ length: 3 }, (_, i) => getYear(new Date()) - i);
const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Helper function to get user-friendly error message with proper typing
const getErrorMessage = (error: ApiError, existingRun: PayrollRun | null): string => {
  // Handle different error scenarios
  if (error.status === 403) {
    if (error.error?.error?.includes('APPROVED')) {
      return `Payroll for ${existingRun?.payroll_month} ${existingRun?.payroll_year} has already been approved and cannot be modified.`;
    }
    if (error.error?.error?.includes('LOCKED')) {
      return `Payroll for ${existingRun?.payroll_month} ${existingRun?.payroll_year} is locked and cannot be modified.`;
    }
    if (error.error?.error?.includes('PAID')) {
      return `Payroll for ${existingRun?.payroll_month} ${existingRun?.payroll_year} has already been paid and cannot be modified.`;
    }
    return `You don't have permission to modify this payroll. Please contact your administrator.`;
  }
  
  if (error.status === 404) {
    if (error.error?.message?.includes('No eligible employees')) {
      return `No eligible employees found for ${existingRun?.payroll_month} ${existingRun?.payroll_year}. Please check employee contracts and statuses.`;
    }
    return `Payroll run not found or no data available for the selected period.`;
  }
  
  if (error.status === 400) {
    if (error.error?.error?.includes('Invalid month')) {
      return `Please select a valid month and year.`;
    }
    return error.error?.message || 'Invalid request. Please check your input.';
  }
  
  if (error.status === 409) {
    return `A payroll run for ${existingRun?.payroll_month} ${existingRun?.payroll_year} is already in progress.`;
  }
  
  // Default error message
  return error.error?.message || 'Failed to process payroll. Please try again.';
};

export default function RunPayroll() {
  const navigate = useNavigate();
  const { session } = useAuthStore();
  const { companyId } = useParams<{ companyId: string }>();

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [existingRunForPeriod, setExistingRunForPeriod] =
    useState<PayrollRun | null>(null);
  const [checkingExistingRun, setCheckingExistingRun] = useState(false);
  const [errorDetails, setErrorDetails] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: 'error' | 'warning' | 'info';
  } | null>(null);

  // Separate selectors
  const [selectedMonth, setSelectedMonth] = useState<string>(
    format(new Date(), "MMMM"),
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    format(new Date(), "yyyy"),
  );

  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [existingRuns, setExistingRuns] = useState<PayrollRun[]>([]);

  // Add this function to check if a run exists for the selected period
  const checkExistingRunForPeriod = useCallback(
  async (month: string, year: number) => {
    if (!companyId || !session?.access_token) return;

    setCheckingExistingRun(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/company/${companyId}/payroll/runs?month=${month}&year=${year}`,
        {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        },
      );
      
      if (response.ok) {
        const data = await response.json();
        
        // Handle both array and paginated response
        let runs: PayrollRun[] = [];
        
        if (Array.isArray(data)) {
          runs = data;
        } else if (data.data && Array.isArray(data.data)) {
          runs = data.data;
        }
        
        const existing = runs.find(
          (run: PayrollRun) =>
            run.payroll_month === month && run.payroll_year === year,
        );
        setExistingRunForPeriod(existing || null);
      }
    } catch (e) {
      console.error("Error checking existing run:", e);
    } finally {
      setCheckingExistingRun(false);
    }
  },
  [companyId, session?.access_token],
);

  // Call this when month/year changes
  useEffect(() => {
    checkExistingRunForPeriod(selectedMonth, parseInt(selectedYear));
  }, [selectedMonth, selectedYear, checkExistingRunForPeriod]);

  const fetchPayrollSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/company/${companyId}/payroll/summary`,
        {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        },
      );
      if (response.ok) {
        const data = await response.json();
        setSummary(data);
      }
    } catch (e) {
      console.error("Summary fetch error:", e);
    } finally {
      setSummaryLoading(false);
    }
  }, [companyId, session?.access_token]);

const fetchRunsWithFilters = useCallback(async (month?: string, year?: number) => {
  if (!companyId || !session?.access_token) return;
  
  try {
    let url = `${API_BASE_URL}/company/${companyId}/payroll/runs?limit=5`;
    if (month && year) {
      url += `&month=${month}&year=${year}`;
    }
    
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    
    if (response.ok) {
      const data = await response.json();
      
      // Handle both array and paginated response
      let runs: PayrollRun[] = [];
      
      if (Array.isArray(data)) {
        runs = data;
      } else if (data.data && Array.isArray(data.data)) {
        runs = data.data;
      } else {
        console.error("Unexpected data format:", data);
        runs = [];
      }
      
      setExistingRuns(runs);
      
      // If we're filtering for a specific month/year, set the existing run
      if (month && year) {
        const existing = runs.find(
          (run: PayrollRun) => 
            run.payroll_month === month && 
            run.payroll_year === year
        );
        setExistingRunForPeriod(existing || null);
      }
    }
  } catch (e) {
    console.error("Runs fetch error:", e);
  }
}, [companyId, session?.access_token]);

// Replace fetchExistingRuns with this enhanced version
const fetchExistingRuns = useCallback(() => {
  fetchRunsWithFilters();
}, [fetchRunsWithFilters]);

  useEffect(() => {
    fetchPayrollSummary();
    fetchExistingRuns();
  }, [fetchPayrollSummary, fetchExistingRuns]);

  const handleProcessPayroll = async () => {
    setLoading(true);
    setErrorDetails(null);

    // Show initial loading toast
    const loadingToast = toast.loading(
      existingRunForPeriod
        ? "Re-synchronizing existing payroll run..."
        : "Initializing new payroll run...",
      {
        description: `Processing ${selectedMonth} ${selectedYear}`,
      },
    );

    try {
      const response = await fetch(
        `${API_BASE_URL}/company/${companyId}/payroll/sync`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            month: selectedMonth,
            year: parseInt(selectedYear),
          }),
        },
      );

      const data = await response.json();
      
      if (!response.ok) {
        // Handle different error status codes with specific messages
        const error: ApiError = {
          status: response.status,
          error: data
        };
        
        if (response.status === 403) {
          if (data.error?.includes('APPROVED')) {
            setErrorDetails({
              show: true,
              title: "Payroll Already Approved",
              message: `Payroll for ${selectedMonth} ${selectedYear} has been approved and cannot be modified. If you need to make changes, please create an adjustment or contact your administrator.`,
              type: 'warning'
            });
          } else if (data.error?.includes('LOCKED')) {
            setErrorDetails({
              show: true,
              title: "Payroll Locked",
              message: `Payroll for ${selectedMonth} ${selectedYear} is locked. Only administrators can unlock it for modifications.`,
              type: 'warning'
            });
          } else if (data.error?.includes('PAID')) {
            setErrorDetails({
              show: true,
              title: "Payroll Already Paid",
              message: `Payroll for ${selectedMonth} ${selectedYear} has already been paid and cannot be modified. Please create a new payroll run for adjustments.`,
              type: 'error'
            });
          } else {
            setErrorDetails({
              show: true,
              title: "Access Denied",
              message: data.message || "You don't have permission to modify this payroll.",
              type: 'error'
            });
          }
        } else if (response.status === 404) {
          if (data.message?.includes('No eligible employees')) {
            setErrorDetails({
              show: true,
              title: "No Eligible Employees",
              message: `No active employees found for ${selectedMonth} ${selectedYear}. Please check employee contracts and ensure they have active status for this period.`,
              type: 'warning'
            });
          } else {
            setErrorDetails({
              show: true,
              title: "Payroll Not Found",
              message: data.message || "The requested payroll run could not be found.",
              type: 'error'
            });
          }
        } else if (response.status === 400) {
          setErrorDetails({
            show: true,
            title: "Invalid Request",
            message: data.error || "Please check your input and try again.",
            type: 'error'
          });
        } else {
          setErrorDetails({
            show: true,
            title: "Processing Failed",
            message: data.message || "An unexpected error occurred. Please try again.",
            type: 'error'
          });
        }
        
        throw error;
      }

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      // Show success toast with detailed information
      if (data.isNewRun) {
        toast.success("New payroll run created", {
          description: `Successfully created payroll for ${selectedMonth} ${selectedYear} with ${data.totals.totalGrossPay > 0 ? "calculated figures" : "no employees"}.`,
          duration: 5000,
          icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
        });

        // Show additional info toast with totals
        toast.info("Payroll Summary", {
          description: (
            <div className="mt-1 text-sm">
              <p>Gross Pay: KES {data.totals.totalGrossPay.toLocaleString()}</p>
              <p>Net Pay: KES {data.totals.totalNetPay.toLocaleString()}</p>
              <p>PAYE: KES {data.totals.totalPaye.toLocaleString()}</p>
            </div>
          ),
          duration: 6000,
          icon: <Info className="h-5 w-5 text-blue-500" />,
        });
      } else {
        toast.success("Payroll re-synchronized", {
          description: `Updated existing payroll for ${selectedMonth} ${selectedYear} with latest changes.`,
          duration: 5000,
          icon: <RefreshCw className="h-5 w-5 text-green-500" />,
        });
      }

      setIsOpen(false);
      setErrorDetails(null);

      // Refresh the runs list
      fetchExistingRuns();
      fetchPayrollSummary();

      // Navigate to the review page
      navigate(
        `/company/${companyId}/payroll/${data.payrollRunId}/review-status`,
      );
    } catch (error) {
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      // Show error toast with user-friendly message
      const apiError = error as ApiError;
      const errorMessage = getErrorMessage(apiError, existingRunForPeriod);
      toast.error("Payroll processing failed", {
        description: errorMessage,
        duration: 7000,
        icon: <Ban className="h-5 w-5 text-red-500" />,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 mb-4">
      {/* Error Alert Dialog */}
      <Dialog open={errorDetails?.show} onOpenChange={(open) => !open && setErrorDetails(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {errorDetails?.type === 'warning' ? (
                <ShieldAlert className="h-5 w-5 text-amber-500" />
              ) : errorDetails?.type === 'info' ? (
                <Info className="h-5 w-5 text-blue-500" />
              ) : (
                <Ban className="h-5 w-5 text-red-500" />
              )}
              {errorDetails?.title}
            </DialogTitle>
            <DialogDescription className="pt-2">
              {errorDetails?.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setErrorDetails(null)}>
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Payroll Processing Card */}
      <Card className="rounded-sm mt-4 border-slate-300 shadow-none overflow-hidden">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-3">
            {/* Left: Main Action - Monthly Payroll */}
            <div className="p-8 border-r border-slate-100 flex flex-col justify-between">
              <div>
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
                    <p>Back</p>
                  </TooltipContent>
                </Tooltip>
                <h2 className="text-2xl font-bold text-slate-900">
                  Monthly Payroll
                </h2>
                <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                  Process full-time employee salaries, statutory deductions, and monthly benefits.
                </p>
              </div>

              <div className="mt-8">
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                  <DialogTrigger asChild>
                    <Button
                      size="lg"
                      className="w-full bg-[#1F3A8A] hover:bg-[#162a63] rounded-sm shadow-none group cursor-pointer"
                    >
                      <TrendingUp className="mr-2 h-5 w-5" />
                      Prepare Monthly Cycle
                      <ChevronRight className="ml-auto h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                      <DialogTitle>Process Monthly Payroll</DialogTitle>
                      <DialogDescription>
                        Select the period to generate or update monthly payroll figures.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-4 py-4">
                      <div className="space-y-2">
                        <Label>Payroll Month</Label>
                        <Select
                          value={selectedMonth}
                          onValueChange={setSelectedMonth}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {months.map((m) => (
                              <SelectItem key={m} value={m}>
                                {m}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Payroll Year</Label>
                        <Select
                          value={selectedYear}
                          onValueChange={setSelectedYear}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {years.map((y) => (
                              <SelectItem key={y} value={y.toString()}>
                                {y}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <ExistingRunPreview
                      month={selectedMonth}
                      year={parseInt(selectedYear)}
                      existingRun={existingRunForPeriod}
                      isLoading={checkingExistingRun}
                    />

                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleProcessPayroll}
                        disabled={loading || checkingExistingRun}
                        className={`cursor-pointer ${
                          existingRunForPeriod
                            ? "bg-amber-600 hover:bg-amber-700"
                            : "bg-[#1F3A8A] hover:bg-[#162a63]"
                        }`}
                      >
                        {loading && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {loading
                          ? existingRunForPeriod
                            ? "Re-synchronizing..."
                            : "Initializing..."
                          : existingRunForPeriod
                            ? "Re-synchronize Payroll"
                            : "Initialize New Payroll"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Center: Current Status Stats */}
            <div className="p-8 border-r border-slate-100 bg-slate-50/30 space-y-6">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Current Status
                </span>
                <div className="flex items-center gap-3">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center ${summary?.current_month.exists ? "bg-amber-100" : "bg-slate-100"}`}
                  >
                    <Clock
                      className={`h-5 w-5 ${summary?.current_month.exists ? "text-amber-600" : "text-slate-400"}`}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {summary?.current_month.exists
                        ? summary.current_month.status || "Draft in Progress"
                        : "No Active Cycle"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {summary?.pending_approvals || 0} items pending approval
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Last Processed
                </span>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {existingRuns.length > 0
                        ? `${existingRuns[0].payroll_month} ${existingRuns[0].payroll_year}`
                        : "N/A"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {existingRuns.length > 0
                        ? `ID: ${existingRuns[0].payroll_number}`
                        : "No history found"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Quick Insights */}
            <div className="p-8 flex flex-col justify-center space-y-6">
              <div>
                <p className="text-sm text-slate-500">Year-to-Date Gross</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-bold text-slate-900">
                    KES {summary?.yearly_total_gross?.toLocaleString() || "0"}
                  </h3>
                  {summary?.growth_percentage && (
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 font-medium">
                      <ArrowUpRight className="h-3 w-3 mr-1" />{" "}
                      {summary.growth_percentage}%
                    </Badge>
                  )}
                </div>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-medium">
                    Headcount
                  </p>
                  <p className="text-lg font-semibold text-slate-800">
                    {existingRuns[0]?.employee_count || 0} Employees
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    navigate(`/company/${companyId}/payroll/history`)
                  }
                >
                  View History
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Casual Workers Section - NEW */}
      <Card className="rounded-sm border-slate-300 shadow-none overflow-hidden bg-linear-to-r from-slate-50 to-white">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-3">
            {/* Left: Casual Workers Action */}
            <div className="p-8 border-r border-slate-100 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Construction className="h-4 w-4 text-amber-600" />
                  </div>
                  <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
                    Coming Soon
                  </Badge>
                </div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Casual Workers
                </h2>
                <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                  Process payments for daily, weekly, or contract-based workers. 
                  Perfect for temporary staff and freelancers.
                </p>
              </div>

              <div className="mt-8">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full border-dashed border-2 border-slate-300 bg-white/50 hover:bg-slate-100 rounded-sm cursor-not-allowed opacity-75"
                  disabled
                >
                  <Timer className="mr-2 h-5 w-5 text-slate-400" />
                  Process Casual Payments
                  <Badge className="ml-auto bg-slate-200 text-slate-600 border-0">
                    Soon
                  </Badge>
                </Button>
              </div>
            </div>

            {/* Center: Quick Stats Placeholder */}
            <div className="p-8 border-r border-slate-100 bg-slate-50/30 space-y-6">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Active Casual Workers
                </span>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
                    <Users className="h-5 w-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">—</p>
                    <p className="text-xs text-slate-500">Coming soon</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Pending Timesheets
                </span>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">—</p>
                    <p className="text-xs text-slate-500">Awaiting data</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Payment Types Preview */}
            <div className="p-8 flex flex-col justify-center space-y-6">
              <div>
                <p className="text-sm text-slate-500 mb-2">Supported payment cycles</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 rounded-full bg-slate-300"></div>
                    <span className="text-slate-600">Daily wages</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 rounded-full bg-slate-300"></div>
                    <span className="text-slate-600">Weekly settlements</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 rounded-full bg-slate-300"></div>
                    <span className="text-slate-600">Project-based contracts</span>
                  </div>
                </div>
              </div>
              <Separator />
              <p className="text-xs text-slate-400 italic">
                No statutory deductions • Flexible payment schedules
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent History Table Style */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">
            Recent Payroll Runs
          </h3>
          <Button
            variant="link"
            className="text-[#1F3A8A] cursor-pointer"
            onClick={() => navigate(`/company/${companyId}/payroll/history`)}
          >
            View all records
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/*show card skeleton for the loading state*/}
          {summaryLoading &&
            [1, 2, 3].map((i) => (
              <Card
                key={i}
                className="animate-pulse border-slate-200 shadow-sm"
              >
                <CardContent className="p-5">
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2 mb-4"></div>
                  <div className="h-3 bg-slate-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded w-5/6"></div>
                </CardContent>
              </Card>
            ))}
          {existingRuns.slice(0, 3).map((run) => (
            <Card
              key={run.id}
              className="hover:border-[#1F3A8A]/30 cursor-pointer transition-all hover:shadow-md rounded-sm group"
              onClick={() =>
                navigate(
                  `/company/${companyId}/payroll/${run.id}/review-status`,
                )
              }
            >
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-[#1F3A8A]/10 transition-colors">
                    <FileText className="h-5 w-5 text-slate-600 group-hover:text-[#1F3A8A]" />
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {run.status.toLowerCase()}
                  </Badge>
                </div>
                <div>
                  <p className="font-bold text-slate-900">
                    {run.payroll_month} {run.payroll_year}
                  </p>
                  <p className="text-xs text-slate-500 uppercase tracking-tighter mb-3">
                    {run.payroll_number}
                  </p>
                  <div className="flex justify-between items-center bg-slate-50 p-2 rounded-md">
                    <span className="text-xs text-slate-500">Net Payable:</span>
                    <span className="text-sm font-bold text-slate-900">
                      KES {run.total_net_pay.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExistingRunPreview({
  month,
  year,
  existingRun,
  isLoading,
}: {
  month: string;
  year: number;
  existingRun: PayrollRun | null;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 my-2">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <p className="text-sm">Checking for existing payroll runs...</p>
        </div>
      </div>
    );
  }

  if (existingRun) {
    // Check if the existing run is in a blocked state
    const isBlocked = ["APPROVED", "LOCKED", "PAID"].includes(existingRun.status);
    
    return (
      <div className={`border rounded-xl p-4 my-2 ${
        isBlocked 
          ? "bg-red-50 border-red-200" 
          : "bg-amber-50 border-amber-200"
      }`}>
        <div className="flex items-start gap-3">
          {isBlocked ? (
            <ShieldAlert className="h-5 w-5 text-red-600 mt-0.5" />
          ) : (
            <RefreshCw className="h-5 w-5 text-amber-600 mt-0.5" />
          )}
          <div className="space-y-2">
            <p className={`text-sm font-medium ${
              isBlocked ? "text-red-800" : "text-amber-800"
            }`}>
              Existing payroll run found for {month} {year}
            </p>
            <div className="bg-white/50 rounded-lg p-3 space-y-1">
              <p className="text-xs text-amber-700">
                <span className="font-medium">Run ID:</span>{" "}
                {existingRun.payroll_number}
              </p>
              <p className="text-xs text-amber-700">
                <span className="font-medium">Status:</span>{" "}
                <Badge
                  variant="outline"
                  className={
                    isBlocked
                      ? "bg-red-100 text-red-700 border-red-300"
                      : "bg-amber-100 text-amber-700 border-amber-300"
                  }
                >
                  {existingRun.status}
                </Badge>
              </p>
              <p className="text-xs text-amber-700">
                <span className="font-medium">Employees:</span>{" "}
                {existingRun.employee_count || 0}
              </p>
              {existingRun.total_net_pay > 0 && (
                <p className="text-xs text-amber-700">
                  <span className="font-medium">Net Pay:</span> KES{" "}
                  {existingRun.total_net_pay.toLocaleString()}
                </p>
              )}
            </div>
            {isBlocked ? (
              <p className="text-xs text-red-600">
                ⚠️ This payroll is {existingRun.status.toLowerCase()} and cannot be modified. 
                {existingRun.status === "LOCKED" && " Contact an administrator to unlock it."}
                {existingRun.status === "APPROVED" && " Create an adjustment if changes are needed."}
                {existingRun.status === "PAID" && " Paid payrolls cannot be modified."}
              </p>
            ) : (
              <p className="text-xs text-amber-600">
                ⚠️ Processing will re-synchronize this run, updating any changes
                made since last calculation.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 my-2">
      <div className="flex items-center gap-3 text-slate-600">
        <AlertCircle className="h-5 w-5" />
        <div>
          <p className="text-sm">
            Initializing <strong>new payroll</strong> for {month} {year}.
          </p>
          <p className="text-xs text-slate-500 mt-1">
            This will calculate all tax bands (PAYE) and statutory rates
            (NSSF/SHIF) based on current employee settings.
          </p>
        </div>
      </div>
    </div>
  );
}