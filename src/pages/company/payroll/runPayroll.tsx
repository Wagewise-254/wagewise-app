// src/pages/company/payroll/RunPayroll.tsx

import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Loader2,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  FileText,
  Calendar,
  Users,
  DollarSign,
  Eye,
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

interface PayrollRun {
  id: string;
  payroll_number: string;
  payroll_month: string;
  payroll_year: number;
  total_net_pay: number;
  total_gross_pay: number;
  total_employees?: number;
  status: string;
  created_at: string;
}

interface PayrollSummary {
  current_month: {
    exists: boolean;
    status?: string;
    total_gross?: number;
    total_net?: number;
    total_employees?: number;
  };
  pending_approvals: number;
  yearly_total_gross: number;
  yearly_total_net: number;
  total_employees: number;
}

const years = Array.from({ length: 3 }, (_, i) => getYear(new Date()) - i);
const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  PREPARED: "bg-blue-100 text-blue-700",
  UNDER_REVIEW: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  LOCKED: "bg-purple-100 text-purple-700",
  PAID: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  REJECTED: "bg-red-100 text-red-700",
};

export default function RunPayroll() {
  const navigate = useNavigate();
  const { session } = useAuthStore();
  const { companyId } = useParams<{ companyId: string }>();

  const [isOpen, setIsOpen] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [existingRunForPeriod, setExistingRunForPeriod] = useState<PayrollRun | null>(null);
  const [checkingExistingRun, setCheckingExistingRun] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), "MMMM"));
  const [selectedYear, setSelectedYear] = useState<string>(format(new Date(), "yyyy"));
  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [recentRuns, setRecentRuns] = useState<PayrollRun[]>([]);
  //const [actionLoading, setActionLoading] = useState(false);

  const checkExistingRunForPeriod = useCallback(async (month: string, year: number) => {
    if (!companyId || !session?.access_token) return;

    setCheckingExistingRun(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/company/${companyId}/payroll/runs?month=${month}&year=${year}`,
        { headers: { Authorization: `Bearer ${session?.access_token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        let runs: PayrollRun[] = [];
        if (Array.isArray(data)) runs = data;
        else if (data.data && Array.isArray(data.data)) runs = data.data;

        const existing = runs.find(
          (run) => run.payroll_month === month && run.payroll_year === year
        );
        setExistingRunForPeriod(existing || null);
      }
    } catch (e) {
      console.error("Error checking existing run:", e);
    } finally {
      setCheckingExistingRun(false);
    }
  }, [companyId, session?.access_token]);

  useEffect(() => {
    checkExistingRunForPeriod(selectedMonth, parseInt(selectedYear));
  }, [selectedMonth, selectedYear, checkExistingRunForPeriod]);

  const fetchData = useCallback(async () => {
    if (!companyId || !session?.access_token) return;

    setSummaryLoading(true);
    try {
      // Fetch summary
      const summaryRes = await fetch(
        `${API_BASE_URL}/company/${companyId}/payroll/summary`,
        { headers: { Authorization: `Bearer ${session?.access_token}` } }
      );
      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setSummary(data);
      }

      // Fetch recent runs
      const runsRes = await fetch(
        `${API_BASE_URL}/company/${companyId}/payroll/runs?limit=3`,
        { headers: { Authorization: `Bearer ${session?.access_token}` } }
      );
      if (runsRes.ok) {
        const data = await runsRes.json();
        let runs: PayrollRun[] = [];
        if (Array.isArray(data)) runs = data;
        else if (data.data && Array.isArray(data.data)) runs = data.data;
        setRecentRuns(runs);
      }
    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      setSummaryLoading(false);
    }
  }, [companyId, session?.access_token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleContinue = () => {
    if (existingRunForPeriod) {
      // If run exists, go to review status
      navigate(`/company/${companyId}/payroll/${existingRunForPeriod.id}/review-status`);
    } else {
      // New run - go to process page with SSE
      navigate(
        `/company/${companyId}/payroll/process?month=${selectedMonth}&year=${parseInt(selectedYear)}`
      );
    }
    setIsOpen(false);
  };

  const getStatusBadge = (status: string) => {
    const colorClass = STATUS_COLORS[status] || "bg-slate-100 text-slate-700";
    return (
      <Badge variant="outline" className={`${colorClass} border-0 capitalize text-xs`}>
        {status.toLowerCase().replace("_", " ")}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Run Payroll</h1>
          <p className="text-sm text-slate-500 mt-1">
            Process monthly payroll, review employee eligibility, and manage approvals
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#7F5EFD] hover:bg-[#6b4de0] text-white rounded-sm">
              <Calendar className="mr-2 h-4 w-4" />
              New Payroll Run
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Start New Payroll Run</DialogTitle>
              <DialogDescription>
                Select the period to process payroll
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label>Month</Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Existing Run Preview */}
            {checkingExistingRun ? (
              <div className="bg-slate-50 border border-slate-200 rounded p-4 my-2">
                <div className="flex items-center gap-3 text-slate-600">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <p className="text-sm">Checking for existing payroll runs...</p>
                </div>
              </div>
            ) : existingRunForPeriod ? (
              <div className="bg-amber-50 border border-amber-200 rounded p-4 my-2">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div className="space-y-2 flex-1">
                    <p className="text-sm font-medium text-amber-800">
                      Existing payroll found for {selectedMonth} {selectedYear}
                    </p>
                    <div className="bg-white/50 rounded p-3 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Run ID:</span>
                        <span className="font-medium">{existingRunForPeriod.payroll_number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Status:</span>
                        {getStatusBadge(existingRunForPeriod.status)}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Employees:</span>
                        <span>{existingRunForPeriod.total_employees || 0}</span>
                      </div>
                      {existingRunForPeriod.total_net_pay > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">Net Pay:</span>
                          <span className="font-medium">
                            KES {existingRunForPeriod.total_net_pay.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded p-4 my-2">
                <div className="flex items-center gap-3 text-slate-600">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      New payroll for {selectedMonth} {selectedYear}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      This will create a new payroll run and process all eligible employees
                    </p>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              {existingRunForPeriod && (
                <Button
                  variant="outline"
                  onClick={() => {
                    navigate(
                      `/company/${companyId}/payroll/${existingRunForPeriod.id}/hub`
                    );
                    setIsOpen(false);
                  }}
                  className="ml-2"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Payroll
                </Button>
              )}
              <Button
                onClick={handleContinue}
                disabled={checkingExistingRun}
                className="bg-[#7F5EFD] hover:bg-[#6b4de0] text-white rounded-sm"
              >
                {existingRunForPeriod ? "Review" : "Prepare Payroll"}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-sm border-slate-200 shadow-none">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Current Month
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {summary?.current_month.exists ? summary.current_month.status || "Draft" : "—"}
                </p>
              </div>
              <div className="h-10 w-10 bg-[#7F5EFD]/10 rounded flex items-center justify-center">
                <Calendar className="h-5 w-5 text-[#7F5EFD]" />
              </div>
            </div>
            {summary?.current_month.exists && summary.current_month.total_employees && (
              <p className="text-xs text-slate-500 mt-2">
                {summary.current_month.total_employees} employees · KES {summary.current_month.total_net?.toLocaleString() || 0}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-sm border-slate-200 shadow-none">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Pending Approvals
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {summary?.pending_approvals || 0}
                </p>
              </div>
              <div className="h-10 w-10 bg-amber-50 rounded flex items-center justify-center">
                <FileText className="h-5 w-5 text-amber-600" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {summary?.pending_approvals === 0 ? "All clear" : "Awaiting review"}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-sm border-slate-200 shadow-none">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Year-to-Date Gross
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  KES {summary?.yearly_total_gross?.toLocaleString() || "0"}
                </p>
              </div>
              <div className="h-10 w-10 bg-emerald-50 rounded flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">Total gross payroll this year</p>
          </CardContent>
        </Card>

        <Card className="rounded-sm border-slate-200 shadow-none">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Active Employees
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {summary?.total_employees || 0}
                </p>
              </div>
              <div className="h-10 w-10 bg-blue-50 rounded flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">Current workforce</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Payroll Runs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Recent Payroll Runs</h2>
          <Button
            variant="link"
            className="text-[#7F5EFD] cursor-pointer"
            onClick={() => navigate(`/company/${companyId}/payroll/history`)}
          >
            View All
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {summaryLoading ? (
            [1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse border-slate-200 shadow-none rounded-sm">
                <CardContent className="p-5">
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2 mb-4"></div>
                  <div className="h-8 bg-slate-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded w-5/6"></div>
                </CardContent>
              </Card>
            ))
          ) : recentRuns.length === 0 ? (
            <Card className="col-span-3 border-slate-200 shadow-none rounded-sm">
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No payroll runs found</p>
                <p className="text-sm text-slate-400 mt-1">Start your first payroll run today</p>
              </CardContent>
            </Card>
          ) : (
            recentRuns.map((run) => (
              <Card
                key={run.id}
                className="border-slate-200 shadow-none rounded-sm hover:border-[#7F5EFD]/30 transition-colors cursor-pointer group"
                onClick={() => navigate(`/company/${companyId}/payroll/${run.id}/review-status`)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {run.payroll_month} {run.payroll_year}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">{run.payroll_number}</p>
                    </div>
                    {getStatusBadge(run.status)}
                  </div>
                  <Separator className="my-3" />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500">Net Pay</p>
                      <p className="text-sm font-bold text-slate-900">
                        KES {run.total_net_pay?.toLocaleString() || "0"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Employees</p>
                      <p className="text-sm font-medium text-slate-700">
                        {run.total_employees || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}