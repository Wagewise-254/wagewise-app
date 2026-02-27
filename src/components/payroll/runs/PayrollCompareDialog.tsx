// src/components/payroll/runs/PayrollCompareDialog.tsx
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRightLeft, TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import axios from "axios";
import { API_BASE_URL } from "@/config";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface PayrollRun {
  id: string;
  payroll_month: string;
  payroll_year: number;
  payroll_number: string;
  total_net_pay: number;
  total_gross_pay: number;
  employee_count: number;
}

interface ComparisonData {
  current: {
    totalGross: number;
    totalNet: number;
    avgPerEmployee: number;
    employeeCount: number;
  };
  previous: {
    totalGross: number;
    totalNet: number;
    avgPerEmployee: number;
    employeeCount: number;
  };
  differences: {
    grossChange: number;
    netChange: number;
    avgChange: number;
    countChange: number;
  };
  departmentBreakdown?: Array<{
    department: string;
    currentNet: number;
    previousNet: number;
    change: number;
  }>;
}

export function PayrollCompareDialog({ 
  currentRunId, 
  companyId,
  onClose // Optional callback when dialog closes
}: { 
  currentRunId: string;
  companyId: string;
  onClose?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [previousRuns, setPreviousRuns] = useState<PayrollRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string>("");
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingRuns, setFetchingRuns] = useState(false);
  const { session } = useAuthStore();

  // Memoized headers for axios
  const headers = useMemo(() => ({
    Authorization: `Bearer ${session?.access_token}`
  }), [session?.access_token]);

  // Memoized fetch function for previous runs
  const fetchPreviousRuns = useCallback(async () => {
    if (!companyId || !currentRunId || !session?.access_token) return;
    
    setFetchingRuns(true);
    try {
      const response = await axios.get<PayrollRun[]>(
        `${API_BASE_URL}/company/${companyId}/payroll/runs`,
        { 
          headers,
          params: {
            exclude: currentRunId,
            limit: 10,
            sort: 'desc'
          }
        }
      );
      setPreviousRuns(response.data);
    } catch (error) {
      console.error("Failed to load previous payroll runs:", error);
      toast.error("Failed to load previous payroll runs");
    } finally {
      setFetchingRuns(false);
    }
  }, [companyId, currentRunId, headers, session?.access_token]);

  // Memoized comparison fetch function
  const fetchComparison = useCallback(async () => {
    if (!selectedRunId || !companyId || !currentRunId || !session?.access_token) return;
    
    setLoading(true);
    try {
      const response = await axios.get<ComparisonData>(
        `${API_BASE_URL}/company/${companyId}/payroll/runs/compare/${currentRunId}/${selectedRunId}`,
        { headers }
      );
      setComparisonData(response.data);
      toast.success("Comparison loaded successfully");
    } catch (error) {
      console.error("Failed to compare payroll runs:", error);
      toast.error("Failed to compare payroll runs");
    } finally {
      setLoading(false);
    }
  }, [selectedRunId, companyId, currentRunId, headers, session?.access_token]);

  // Load runs when dialog opens
  useEffect(() => {
    if (open) {
      fetchPreviousRuns();
    } else {
      // Reset state when dialog closes
      setSelectedRunId("");
      setComparisonData(null);
      onClose?.();
    }
  }, [open, fetchPreviousRuns, onClose]);

  // Memoized formatters
  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }, []);

  const getChangeIndicator = useCallback((change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-emerald-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-rose-500" />;
    return <Minus className="h-4 w-4 text-slate-400" />;
  }, []);

  const getChangeColor = useCallback((change: number) => {
    if (change > 0) return "text-emerald-600";
    if (change < 0) return "text-rose-600";
    return "text-slate-600";
  }, []);

  // Memoized select options
  const runOptions = useMemo(() => {
    return previousRuns.map((run) => ({
      value: run.id,
      label: `${run.payroll_month} ${run.payroll_year} - ${run.payroll_number}`
    }));
  }, [previousRuns]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <ArrowRightLeft className="h-4 w-4" />
          Compare with previous
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compare Payroll Runs</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Run Selector */}
          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label>Compare with previous run</Label>
              <Select 
                value={selectedRunId} 
                onValueChange={setSelectedRunId}
                disabled={fetchingRuns}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    fetchingRuns ? "Loading runs..." : "Select a payroll run"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {runOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                  {runOptions.length === 0 && !fetchingRuns && (
                    <SelectItem value="none" disabled>
                      No previous runs found
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={fetchComparison} 
              disabled={!selectedRunId || loading || fetchingRuns}
              className="min-w-25"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading...
                </>
              ) : (
                'Compare'
              )}
            </Button>
          </div>

          {comparisonData && (
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="breakdown">Department Breakdown</TabsTrigger>
                <TabsTrigger value="details">Detailed Comparison</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Total Gross */}
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-slate-500">Total Gross Pay</p>
                      <div className="flex items-center justify-between mt-2">
                        <div>
                          <p className="text-xs text-slate-400">Current</p>
                          <p className="text-lg font-bold">
                            KES {formatCurrency(comparisonData.current.totalGross)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-400">Previous</p>
                          <p className="text-lg font-bold">
                            KES {formatCurrency(comparisonData.previous.totalGross)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        {getChangeIndicator(comparisonData.differences.grossChange)}
                        <span className={getChangeColor(comparisonData.differences.grossChange)}>
                          {comparisonData.differences.grossChange > 0 ? '+' : ''}
                          {comparisonData.differences.grossChange}%
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Total Net */}
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-slate-500">Total Net Pay</p>
                      <div className="flex items-center justify-between mt-2">
                        <div>
                          <p className="text-xs text-slate-400">Current</p>
                          <p className="text-lg font-bold">
                            KES {formatCurrency(comparisonData.current.totalNet)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-400">Previous</p>
                          <p className="text-lg font-bold">
                            KES {formatCurrency(comparisonData.previous.totalNet)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        {getChangeIndicator(comparisonData.differences.netChange)}
                        <span className={getChangeColor(comparisonData.differences.netChange)}>
                          {comparisonData.differences.netChange > 0 ? '+' : ''}
                          {comparisonData.differences.netChange}%
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Employee Count */}
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-slate-500">Employees</p>
                      <div className="flex items-center justify-between mt-2">
                        <div>
                          <p className="text-xs text-slate-400">Current</p>
                          <p className="text-lg font-bold">
                            {comparisonData.current.employeeCount}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-400">Previous</p>
                          <p className="text-lg font-bold">
                            {comparisonData.previous.employeeCount}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        {getChangeIndicator(comparisonData.differences.countChange)}
                        <span className={getChangeColor(comparisonData.differences.countChange)}>
                          {comparisonData.differences.countChange > 0 ? '+' : ''}
                          {comparisonData.differences.countChange}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="breakdown">
                {comparisonData.departmentBreakdown && (
                  <div className="space-y-2 max-h-100 overflow-y-auto pr-2">
                    {comparisonData.departmentBreakdown.map((dept) => (
                      <div key={dept.department} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                        <span className="font-medium">{dept.department}</span>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-xs text-slate-400">Current</p>
                            <p className="font-medium">KES {formatCurrency(dept.currentNet)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-400">Previous</p>
                            <p className="font-medium">KES {formatCurrency(dept.previousNet)}</p>
                          </div>
                          <Badge 
                            variant={dept.change > 0 ? "default" : "secondary"} 
                            className={`min-w-20 ${dept.change > 0 ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : ''}`}
                          >
                            {dept.change > 0 ? '+' : ''}{dept.change}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="details">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-4">
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          Current Run
                        </h4>
                        <div className="space-y-2 text-sm">
                          <p className="flex justify-between">
                            <span className="text-slate-500">Gross Pay:</span>
                            <span className="font-medium">KES {formatCurrency(comparisonData.current.totalGross)}</span>
                          </p>
                          <p className="flex justify-between">
                            <span className="text-slate-500">Net Pay:</span>
                            <span className="font-medium">KES {formatCurrency(comparisonData.current.totalNet)}</span>
                          </p>
                          <p className="flex justify-between">
                            <span className="text-slate-500">Avg per Employee:</span>
                            <span className="font-medium">KES {formatCurrency(comparisonData.current.avgPerEmployee)}</span>
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-4">
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 bg-slate-400 rounded-full"></span>
                          Previous Run
                        </h4>
                        <div className="space-y-2 text-sm">
                          <p className="flex justify-between">
                            <span className="text-slate-500">Gross Pay:</span>
                            <span className="font-medium">KES {formatCurrency(comparisonData.previous.totalGross)}</span>
                          </p>
                          <p className="flex justify-between">
                            <span className="text-slate-500">Net Pay:</span>
                            <span className="font-medium">KES {formatCurrency(comparisonData.previous.totalNet)}</span>
                          </p>
                          <p className="flex justify-between">
                            <span className="text-slate-500">Avg per Employee:</span>
                            <span className="font-medium">KES {formatCurrency(comparisonData.previous.avgPerEmployee)}</span>
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}