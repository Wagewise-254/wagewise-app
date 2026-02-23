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
  ArrowLeft
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

export default function RunPayroll() {
  const navigate = useNavigate();
  const { session } = useAuthStore();
  const { companyId } = useParams<{ companyId: string }>();

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(true);

  // Separate selectors
  const [selectedMonth, setSelectedMonth] = useState<string>(
    format(new Date(), "MMMM"),
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    format(new Date(), "yyyy"),
  );

  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [existingRuns, setExistingRuns] = useState<PayrollRun[]>([]);

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

  const fetchExistingRuns = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/company/${companyId}/payroll/runs?limit=5`,
        {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        },
      );
      if (response.ok) {
        const data = await response.json();
        setExistingRuns(data);
      }
    } catch (e) {
      console.error("Runs fetch error:", e);
    }
  }, [companyId, session?.access_token]);

  useEffect(() => {
    fetchPayrollSummary();
    fetchExistingRuns();
  }, [fetchPayrollSummary, fetchExistingRuns]);

  const handleProcessPayroll = async () => {
    setLoading(true);
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
      if (!response.ok) throw new Error(data.error || "Failed to process");

      toast.success("Payroll cycle initiated successfully");
      setIsOpen(false);
      navigate(
        `/company/${companyId}/payroll/${data.payrollRunId}/review-status`,
      );
    } catch (error: unknown) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-sm mt-4 border-slate-300 shadow-none overflow-hidden">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-3">
            {/* Left: Main Action */}
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
                  Payroll Processing
                </h2>
                <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                  Manage your monthly payroll cycles, recalculate statutory
                  deductions, and prepare disbursements.
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
                      Prepare New Cycle
                      <ChevronRight className="ml-auto h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                      <DialogTitle>Process Payroll Cycle</DialogTitle>
                      <DialogDescription>
                        Select the period to generate or update payroll figures.
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
                        disabled={loading}
                        className="bg-[#1F3A8A] cursor-pointer"
                      >
                        {loading && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Initialize Cycle
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

function ExistingRunPreview({ month, year }: { month: string; year: number }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 my-2">
      <div className="flex items-center gap-3 text-slate-600">
        <AlertCircle className="h-5 w-5" />
        <p className="text-sm">
          Initializing for{" "}
          <strong>
            {month} {year}
          </strong>
          . This will recalculate all tax bands (PAYE) and statutory rates
          (NSSF/SHIF) based on current employee settings.
        </p>
      </div>
    </div>
  );
}
