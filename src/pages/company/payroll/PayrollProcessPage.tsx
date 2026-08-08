// src/pages/company/payroll/PayrollProcessPage.tsx

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  TrendingUp,
  FileText,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { API_BASE_URL } from "@/config";
import { useAuthStore } from "@/stores/authStore";

// Define specific types instead of using 'any'
interface ProgressData {
  current?: number;
  total?: number;
  employeeId?: string;
  eligible?: boolean;
  [key: string]: unknown;
}

interface ProgressLog {
  step: string;
  message: string;
  data?: ProgressData;
  error?: boolean;
}

interface CalculationResult {
  payrollRunId: string;
  totalEmployees: number;
  eligibleCount: number;
  ineligibleCount: number;
  totalGrossPay: number;
  totalNetPay: number;
}

const STEP_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  STARTED: { label: "Initializing", icon: <Loader2 className="h-4 w-4 animate-spin" /> },
  FETCHING_EMPLOYEES: { label: "Fetching Employees", icon: <Users className="h-4 w-4" /> },
  EMPLOYEES_FETCHED: { label: "Employees Loaded", icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" /> },
  FETCHING_ALLOWANCES: { label: "Loading Allowances", icon: <TrendingUp className="h-4 w-4" /> },
  FETCHING_DEDUCTIONS: { label: "Loading Deductions", icon: <FileText className="h-4 w-4" /> },
  FILTERING_PERIOD: { label: "Filtering by Period", icon: <Clock className="h-4 w-4" /> },
  PERIOD_FILTERED: { label: "Period Filtered", icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" /> },
  FETCHING_ABSENT_DAYS: { label: "Checking Absent Days", icon: <Clock className="h-4 w-4" /> },
  CALCULATING: { label: "Calculating Payroll", icon: <Loader2 className="h-4 w-4 animate-spin" /> },
  PROCESSING_EMPLOYEE: { label: "Processing Employee", icon: <Users className="h-4 w-4" /> },
  SAVING: { label: "Saving Results", icon: <FileText className="h-4 w-4" /> },
  UPDATING_RUN: { label: "Finalizing", icon: <RefreshCw className="h-4 w-4" /> },
  INITIALIZING_REVIEWS: { label: "Setting Up Reviews", icon: <CheckCircle2 className="h-4 w-4" /> },
  COMPLETED: { label: "Complete!", icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" /> },
  ERROR: { label: "Error", icon: <XCircle className="h-4 w-4 text-red-500" /> },
};

export default function PayrollProcessPage() {
  const navigate = useNavigate();
  const { companyId } = useParams<{ companyId: string }>();
  const [searchParams] = useSearchParams();
  const { session } = useAuthStore();

  const month = searchParams.get("month");
  const year = searchParams.get("year");

  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<ProgressLog[]>([]);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const isMounted = useRef(true);

  const scrollToBottom = useCallback(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (logs.length > 0) {
      scrollToBottom();
    }
  }, [logs, scrollToBottom]);

  useEffect(() => {
    if (showResult && resultRef.current) {
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    }
  }, [showResult]);

  const startCalculation = useCallback(async () => {
    if (!companyId || !session?.access_token || !month || !year) {
      setError("Missing required parameters");
      return;
    }

    setIsProcessing(true);
    setLogs([]);
    setProgress(0);
    setResult(null);
    setShowResult(false);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/company/${companyId}/payroll/calculate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ month, year: parseInt(year) }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Calculation failed");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      let buffer = "";
      let reading = true;

      while (reading) {
        const { done, value } = await reader.read();
        if (done) {
          reading = false;
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              
              // Only update state if component is still mounted
              if (isMounted.current) {
                setLogs((prev) => [...prev, data]);

                // Update progress based on step
                const stepProgress: Record<string, number> = {
                  STARTED: 5,
                  FETCHING_EMPLOYEES: 10,
                  EMPLOYEES_FETCHED: 15,
                  FETCHING_ALLOWANCES: 20,
                  FETCHING_DEDUCTIONS: 25,
                  FILTERING_PERIOD: 30,
                  PERIOD_FILTERED: 35,
                  FETCHING_ABSENT_DAYS: 40,
                  CALCULATING: 50,
                  PROCESSING_EMPLOYEE: 65,
                  SAVING: 80,
                  UPDATING_RUN: 90,
                  INITIALIZING_REVIEWS: 95,
                  COMPLETED: 100,
                };

                if (data.step && stepProgress[data.step] !== undefined) {
                  setProgress(stepProgress[data.step]);
                }

                // Handle employee progress
                if (data.step === "PROCESSING_EMPLOYEE" && data.data) {
                  const { current = 0, total = 1 } = data.data;
                  const baseProgress = 50;
                  const range = 30;
                  const employeeProgress = baseProgress + (current / total) * range;
                  setProgress(Math.min(employeeProgress, 80));
                }

                // Handle completion
                if (data.step === "COMPLETED" && data.data) {
                  setResult(data.data);
                  setShowResult(true);
                }

                if (data.error) {
                  setError(data.message);
                }
              }
            } catch (e) {
              console.error("Failed to parse SSE data:", e);
            }
          }
        }
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setLogs((prev) => [
          ...prev,
          {
            step: "ERROR",
            message: err instanceof Error ? err.message : "Calculation failed",
            error: true,
          },
        ]);
      }
    } finally {
      if (isMounted.current) {
        setIsProcessing(false);
      }
    }
  }, [companyId, session?.access_token, month, year]);

  useEffect(() => {
    isMounted.current = true;
    startCalculation();

    return () => {
      isMounted.current = false;
    };
  }, [startCalculation]);

  const formatMessage = useCallback((log: ProgressLog) => {
    if (log.step === "PROCESSING_EMPLOYEE" && log.data) {
      const { current, total, eligible } = log.data;
      const status = eligible ? "✅" : "⛔";
      return `${log.message} (${current}/${total}) ${status}`;
    }
    return log.message;
  }, []);

  const getLogIcon = useCallback((log: ProgressLog) => {
    if (log.error) return <XCircle className="h-4 w-4 text-red-500" />;
    if (log.step === "COMPLETED") return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    if (log.step === "STARTED" || log.step === "CALCULATING") {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    const stepInfo = STEP_LABELS[log.step];
    if (stepInfo?.icon) return stepInfo.icon;
    return <Clock className="h-4 w-4 text-slate-400" />;
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Processing Payroll
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {month} {year}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">
            {isProcessing ? "Processing..." : progress === 100 ? "Complete!" : "Ready"}
          </span>
          <span className="text-sm font-medium text-slate-500">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Logs */}
      <Card className="border-slate-200 shadow-none rounded-sm">
        <CardContent className="p-0">
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Progress Log</span>
              <Badge variant="outline" className="bg-white">
                {logs.length} steps
              </Badge>
            </div>
          </div>
          <div className="p-6 max-h-100 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-slate-400">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                Initializing...
              </div>
            ) : (
              <div className="space-y-2">
                {logs.map((log, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-3 p-2 rounded ${
                      log.error
                        ? "bg-red-50 text-red-700"
                        : log.step === "COMPLETED"
                        ? "bg-emerald-50 text-emerald-700"
                        : "hover:bg-slate-100/50"
                    }`}
                  >
                    <div className="mt-0.5">{getLogIcon(log)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-xs text-slate-400">
                          [{log.step}]
                        </span>
                        <span className="text-sm">{formatMessage(log)}</span>
                      </div>
                      {log.data && log.step === "PROCESSING_EMPLOYEE" && (
                        <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                          <span>Employee ID: {log.data.employeeId}</span>
                          <span>•</span>
                          <span>
                            {log.data.eligible ? "Eligible ✅" : "Ineligible ⛔"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Result Card */}
      {showResult && result && (
        <div ref={resultRef} className="mt-6">
          <Card className="border-emerald-200 shadow-none rounded-sm bg-emerald-50/30">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-emerald-900">
                    Payroll Calculation Complete!
                  </h3>
                  <p className="text-sm text-emerald-700 mt-1">
                    Successfully processed {result.totalEmployees} employees
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div className="bg-white/50 rounded p-3">
                      <p className="text-xs text-slate-500">Total Employees</p>
                      <p className="text-lg font-bold text-slate-900">
                        {result.totalEmployees}
                      </p>
                    </div>
                    <div className="bg-white/50 rounded p-3">
                      <p className="text-xs text-slate-500">Eligible</p>
                      <p className="text-lg font-bold text-emerald-600">
                        {result.eligibleCount}
                      </p>
                    </div>
                    <div className="bg-white/50 rounded p-3">
                      <p className="text-xs text-slate-500">Ineligible</p>
                      <p className="text-lg font-bold text-amber-600">
                        {result.ineligibleCount}
                      </p>
                    </div>
                    <div className="bg-white/50 rounded p-3">
                      <p className="text-xs text-slate-500">Total Gross Pay</p>
                      <p className="text-lg font-bold text-slate-900">
                        KES {result.totalGrossPay?.toLocaleString() || "0"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-6">
                    <Button
                      onClick={() =>
                        navigate(
                          `/company/${companyId}/payroll/${result.payrollRunId}/review-status`
                        )
                      }
                      className="bg-[#7F5EFD] hover:bg-[#6b4de0] text-white rounded-sm"
                    >
                      Review Payroll
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        navigate(`/company/${companyId}/payroll/history`)
                      }
                      className="rounded-sm"
                    >
                      View All Runs
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="mt-6 border-red-200 shadow-none rounded-sm bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-900">Calculation Failed</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <Button
                  variant="outline"
                  className="mt-4 border-red-300 text-red-700 hover:bg-red-100"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}