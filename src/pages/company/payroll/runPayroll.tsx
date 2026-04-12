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
  RefreshCw,
  Info,
  Users,
  Timer,
  Calendar,
  Construction,
  Ban,
  ShieldAlert,
  Edit2,
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
import { Separator } from "@/components/ui/separator";
import { API_BASE_URL } from "@/config";
import { useAuthStore } from "@/stores/authStore";

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
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [existingRunForPeriod, setExistingRunForPeriod] =
    useState<PayrollRun | null>(null);
  const [checkingExistingRun, setCheckingExistingRun] = useState(false);
  const [errorDetails, setErrorDetails] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: "error" | "warning" | "info";
  } | null>(null);

  const [selectedMonth, setSelectedMonth] = useState<string>(
    format(new Date(), "MMMM"),
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    format(new Date(), "yyyy"),
  );

  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [existingRuns, setExistingRuns] = useState<PayrollRun[]>([]);

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

  const fetchRunsWithFilters = useCallback(async () => {
    if (!companyId || !session?.access_token) return;

    try {
      const url = `${API_BASE_URL}/company/${companyId}/payroll/runs?limit=5`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });

      if (response.ok) {
        const data = await response.json();
        let runs: PayrollRun[] = [];

        if (Array.isArray(data)) {
          runs = data;
        } else if (data.data && Array.isArray(data.data)) {
          runs = data.data;
        }

        setExistingRuns(runs);
      }
    } catch (e) {
      console.error("Runs fetch error:", e);
    }
  }, [companyId, session?.access_token]);

  const fetchExistingRuns = useCallback(() => {
    fetchRunsWithFilters();
  }, [fetchRunsWithFilters]);

  useEffect(() => {
    fetchPayrollSummary();
    fetchExistingRuns();
  }, [fetchPayrollSummary, fetchExistingRuns]);

  return (
    <div className="space-y-6 mb-4">
      {/* Error Alert Dialog */}
      <Dialog
        open={errorDetails?.show}
        onOpenChange={(open) => !open && setErrorDetails(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {errorDetails?.type === "warning" ? (
                <ShieldAlert className="h-5 w-5 text-amber-500" />
              ) : errorDetails?.type === "info" ? (
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
            <Button onClick={() => setErrorDetails(null)}>Got it</Button>
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
                <h2 className="text-2xl font-bold text-slate-900">
                  Monthly Payroll
                </h2>
                <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                  Process full-time employee salaries, statutory deductions, and
                  monthly benefits.
                </p>
              </div>

              <div className="mt-8">
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                  <DialogTrigger asChild>
                    <Button
                      size="lg"
                      className="w-full bg-[#7F5EFD] hover:bg-[#6b4de0] rounded-sm shadow-none group cursor-pointer"
                    >
                      <TrendingUp className="mr-2 h-5 w-5" />
                      Prepare Monthly Cycle
                      <ChevronRight className="ml-auto h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Process Monthly Payroll</DialogTitle>
                      <DialogDescription>
                        Select the period to generate or update monthly payroll
                        figures.
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
                        onClick={() => {
                          navigate(
                            `/company/${companyId}/payroll/eligibility?month=${selectedMonth}&year=${parseInt(selectedYear)}`,
                          );
                          setIsOpen(false);
                        }}
                        disabled={checkingExistingRun}
                        className="bg-[#7F5EFD] hover:bg-[#6b4de0] text-white"
                      >
                        Review Employee Eligibility
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                      {existingRunForPeriod &&
                        !["APPROVED", "LOCKED", "PAID"].includes(
                          existingRunForPeriod.status,
                        ) && (
                          <Button
                            variant="outline"
                            onClick={() => {
                              navigate(
                                `/company/${companyId}/payroll/eligibility?month=${selectedMonth}&year=${parseInt(selectedYear)}&editMode=true`,
                              );
                              setIsOpen(false);
                            }}
                            className="mt-2"
                          >
                            <Edit2 className="mr-2 h-4 w-4" />
                            Edit Existing Run
                          </Button>
                        )}
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

      {/* Casual Workers Section */}
      <Card className="rounded-sm border-slate-300 shadow-none overflow-hidden bg-linear-to-r from-slate-50 to-white">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-3">
            <div className="p-8 border-r border-slate-100 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Construction className="h-4 w-4 text-amber-600" />
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-amber-50 text-amber-600 border-amber-200"
                  >
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

            <div className="p-8 flex flex-col justify-center space-y-6">
              <div>
                <p className="text-sm text-slate-500 mb-2">
                  Supported payment cycles
                </p>
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
                    <span className="text-slate-600">
                      Project-based contracts
                    </span>
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
    const isBlocked = ["APPROVED", "LOCKED", "PAID"].includes(
      existingRun.status,
    );

    return (
      <div
        className={`border rounded-xl p-4 my-2 ${
          isBlocked
            ? "bg-red-50 border-red-200"
            : "bg-amber-50 border-amber-200"
        }`}
      >
        <div className="flex items-start gap-3">
          {isBlocked ? (
            <ShieldAlert className="h-5 w-5 text-red-600 mt-0.5" />
          ) : (
            <RefreshCw className="h-5 w-5 text-amber-600 mt-0.5" />
          )}
          <div className="space-y-2">
            <p
              className={`text-sm font-medium ${
                isBlocked ? "text-red-800" : "text-amber-800"
              }`}
            >
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
                ⚠️ This payroll is {existingRun.status.toLowerCase()} and cannot
                be modified.
                {existingRun.status === "LOCKED" &&
                  " Contact an administrator to unlock it."}
                {existingRun.status === "APPROVED" &&
                  " Create an adjustment if changes are needed."}
                {existingRun.status === "PAID" &&
                  " Paid payrolls cannot be modified."}
              </p>
            ) : (
              <p className="text-xs text-amber-600">
                ⚠️ You can still review and modify employee eligibility before
                processing.
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
            You'll be able to review employee eligibility before processing
            calculations.
          </p>
        </div>
      </div>
    </div>
  );
}
