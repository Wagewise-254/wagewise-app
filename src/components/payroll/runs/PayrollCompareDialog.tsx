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
import { 
  ArrowRightLeft, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Loader2,
  Users,
  UserPlus,
  UserMinus,
  UserCheck,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import axios from "axios";
import { API_BASE_URL } from "@/config";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface PayrollRun {
  id: string;
  payroll_month: string;
  payroll_year: number;
  payroll_number: string;
  total_net_pay: number;
  total_gross_pay: number;
  employee_count: number;
}

interface EmployeeData {
  id: string;
  name: string;
  employeeNumber: string;
  department: string;
  jobTitle: string;
  grossPay: number;
  netPay: number;
  totalDeductions: number;
  basicSalary: number;
  totalAllowances: number;
  payeTax: number;
  nssf: number;
  shif: number;
  helb: number;
  housingLevy: number;
  allowancesDetails?: Record<string, unknown>;
  deductionsDetails?: Record<string, unknown>;
}

interface ChangedEmployee extends EmployeeData {
  previous: EmployeeData;
  changes: {
    grossPay: number;
    netPay: number;
    deductions: number;
    basicSalary: number;
    payeTax: number;
    grossPayPercent: number;
    netPayPercent: number;
  };
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
  employeeComparison: {
    unchanged: EmployeeData[];
    changed: ChangedEmployee[];
    new: EmployeeData[];
    removed: EmployeeData[];
    stats: {
      total: number;
      unchanged: number;
      changed: number;
      new: number;
      removed: number;
    };
  };
}

export function PayrollCompareDialog({ 
  currentRunId, 
  companyId,
  onClose
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

  const headers = useMemo(() => ({
    Authorization: `Bearer ${session?.access_token}`
  }), [session?.access_token]);

  const fetchPreviousRuns = useCallback(async () => {
    if (!companyId || !currentRunId || !session?.access_token) return;
    
    setFetchingRuns(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/company/${companyId}/payroll/runs`,
        { 
          headers,
          params: {
            limit: 10
          }
        }
      );
      
      // Handle both array and paginated response
      let runs: PayrollRun[] = [];
      if (Array.isArray(response.data)) {
        runs = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        runs = response.data.data;
      }
      
      // Filter out current run
      const filtered = runs.filter(run => run.id !== currentRunId);
      setPreviousRuns(filtered);
    } catch (error) {
      console.error("Failed to load previous payroll runs:", error);
      toast.error("Failed to load previous payroll runs");
    } finally {
      setFetchingRuns(false);
    }
  }, [companyId, currentRunId, headers, session?.access_token]);

  const fetchComparison = useCallback(async () => {
    if (!selectedRunId || !companyId || !currentRunId || !session?.access_token) return;
    
    setLoading(true);
    try {
      const response = await axios.get(
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

  useEffect(() => {
    if (open) {
      fetchPreviousRuns();
    } else {
      setSelectedRunId("");
      setComparisonData(null);
      onClose?.();
    }
  }, [open, fetchPreviousRuns, onClose]);

  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const runOptions = useMemo(() => {
    return previousRuns.map((run) => ({
      value: run.id,
      label: `${run.payroll_month} ${run.payroll_year} - ${run.payroll_number} (${formatCurrency(run.total_net_pay)})`
    }));
  }, [previousRuns, formatCurrency]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <ArrowRightLeft className="h-4 w-4" />
          Compare with previous
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
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
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="employees" className="relative">
                  Employee Changes
                  {comparisonData.employeeComparison.stats.changed > 0 && (
                    <Badge className="ml-2 bg-amber-500 text-white">
                      {comparisonData.employeeComparison.stats.changed}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="breakdown">Department</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="space-y-4">
                {/* Employee Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-emerald-500" />
                          <p className="text-xs text-slate-500">Unchanged</p>
                        </div>
                        <span className="font-bold">{comparisonData.employeeComparison.stats.unchanged}</span>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-amber-500" />
                          <p className="text-xs text-slate-500">Changed</p>
                        </div>
                        <span className="font-bold">{comparisonData.employeeComparison.stats.changed}</span>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <UserPlus className="h-4 w-4 text-blue-500" />
                          <p className="text-xs text-slate-500">New</p>
                        </div>
                        <span className="font-bold">{comparisonData.employeeComparison.stats.new}</span>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <UserMinus className="h-4 w-4 text-rose-500" />
                          <p className="text-xs text-slate-500">Removed</p>
                        </div>
                        <span className="font-bold">{comparisonData.employeeComparison.stats.removed}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-slate-500">Total Gross Pay</p>
                      <div className="flex items-center justify-between mt-2">
                        <div>
                          <p className="text-xs text-slate-400">Current</p>
                          <p className="text-lg font-bold">
                            {formatCurrency(comparisonData.current.totalGross)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-400">Previous</p>
                          <p className="text-lg font-bold">
                            {formatCurrency(comparisonData.previous.totalGross)}
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

                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-slate-500">Total Net Pay</p>
                      <div className="flex items-center justify-between mt-2">
                        <div>
                          <p className="text-xs text-slate-400">Current</p>
                          <p className="text-lg font-bold">
                            {formatCurrency(comparisonData.current.totalNet)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-400">Previous</p>
                          <p className="text-lg font-bold">
                            {formatCurrency(comparisonData.previous.totalNet)}
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

              <TabsContent value="employees">
                <Tabs defaultValue="changed" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="changed" className="relative">
                      Changed
                      {comparisonData.employeeComparison.changed.length > 0 && (
                        <Badge className="ml-2 bg-amber-500 text-white">
                          {comparisonData.employeeComparison.changed.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="new">
                      New
                      {comparisonData.employeeComparison.new.length > 0 && (
                        <Badge className="ml-2 bg-blue-500 text-white">
                          {comparisonData.employeeComparison.new.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="removed">
                      Removed
                      {comparisonData.employeeComparison.removed.length > 0 && (
                        <Badge className="ml-2 bg-rose-500 text-white">
                          {comparisonData.employeeComparison.removed.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="unchanged">
                      Unchanged
                      {comparisonData.employeeComparison.unchanged.length > 0 && (
                        <Badge className="ml-2 bg-slate-500 text-white">
                          {comparisonData.employeeComparison.unchanged.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="changed">
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead className="text-right">Gross Pay</TableHead>
                            <TableHead className="text-right">Net Pay</TableHead>
                            <TableHead className="text-right">Deductions</TableHead>
                            <TableHead className="text-right">Change</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {comparisonData.employeeComparison.changed.map((emp) => (
                            <TableRow key={emp.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="text-xs">
                                      {getInitials(emp.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">{emp.name}</p>
                                    <p className="text-xs text-slate-500">{emp.employeeNumber}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{emp.department}</TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(emp.grossPay)}
                                <div className="text-xs text-slate-400">
                                  prev: {formatCurrency(emp.previous.grossPay)}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <span className="font-medium">{formatCurrency(emp.netPay)}</span>
                                <div className="text-xs">
                                  <span className={getChangeColor(emp.changes.netPayPercent)}>
                                    {emp.changes.netPayPercent > 0 ? '+' : ''}
                                    {emp.changes.netPayPercent}%
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(emp.totalDeductions)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge variant="outline" className={
                                  emp.changes.netPay > 0 
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : "bg-rose-50 text-rose-700 border-rose-200"
                                }>
                                  {emp.changes.netPay > 0 ? '+' : ''}
                                  {formatCurrency(emp.changes.netPay)}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                          {comparisonData.employeeComparison.changed.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={6} className="h-32 text-center">
                                <div className="flex flex-col items-center text-slate-400">
                                  <UserCheck className="h-8 w-8 mb-2 opacity-20" />
                                  <p>No changed employees</p>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>

                  <TabsContent value="new">
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Job Title</TableHead>
                            <TableHead className="text-right">Gross Pay</TableHead>
                            <TableHead className="text-right">Net Pay</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {comparisonData.employeeComparison.new.map((emp) => (
                            <TableRow key={emp.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="text-xs">
                                      {getInitials(emp.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">{emp.name}</p>
                                    <p className="text-xs text-slate-500">{emp.employeeNumber}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{emp.department}</TableCell>
                              <TableCell>{emp.jobTitle}</TableCell>
                              <TableCell className="text-right">{formatCurrency(emp.grossPay)}</TableCell>
                              <TableCell className="text-right font-medium text-blue-600">
                                {formatCurrency(emp.netPay)}
                              </TableCell>
                            </TableRow>
                          ))}
                          {comparisonData.employeeComparison.new.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={5} className="h-32 text-center">
                                <div className="flex flex-col items-center text-slate-400">
                                  <UserPlus className="h-8 w-8 mb-2 opacity-20" />
                                  <p>No new employees</p>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>

                  <TabsContent value="removed">
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Job Title</TableHead>
                            <TableHead className="text-right">Previous Gross</TableHead>
                            <TableHead className="text-right">Previous Net</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {comparisonData.employeeComparison.removed.map((emp) => (
                            <TableRow key={emp.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="text-xs">
                                      {getInitials(emp.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">{emp.name}</p>
                                    <p className="text-xs text-slate-500">{emp.employeeNumber}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{emp.department}</TableCell>
                              <TableCell>{emp.jobTitle}</TableCell>
                              <TableCell className="text-right">{formatCurrency(emp.grossPay)}</TableCell>
                              <TableCell className="text-right font-medium text-rose-600">
                                {formatCurrency(emp.netPay)}
                              </TableCell>
                            </TableRow>
                          ))}
                          {comparisonData.employeeComparison.removed.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={5} className="h-32 text-center">
                                <div className="flex flex-col items-center text-slate-400">
                                  <UserMinus className="h-8 w-8 mb-2 opacity-20" />
                                  <p>No removed employees</p>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>

                  <TabsContent value="unchanged">
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Job Title</TableHead>
                            <TableHead className="text-right">Gross Pay</TableHead>
                            <TableHead className="text-right">Net Pay</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {comparisonData.employeeComparison.unchanged.slice(0, 10).map((emp) => (
                            <TableRow key={emp.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="text-xs">
                                      {getInitials(emp.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">{emp.name}</p>
                                    <p className="text-xs text-slate-500">{emp.employeeNumber}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{emp.department}</TableCell>
                              <TableCell>{emp.jobTitle}</TableCell>
                              <TableCell className="text-right">{formatCurrency(emp.grossPay)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(emp.netPay)}</TableCell>
                            </TableRow>
                          ))}
                          {comparisonData.employeeComparison.unchanged.length > 10 && (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-sm text-slate-500 py-4">
                                +{comparisonData.employeeComparison.unchanged.length - 10} more unchanged employees
                              </TableCell>
                            </TableRow>
                          )}
                          {comparisonData.employeeComparison.unchanged.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={5} className="h-32 text-center">
                                <div className="flex flex-col items-center text-slate-400">
                                  <Users className="h-8 w-8 mb-2 opacity-20" />
                                  <p>No unchanged employees</p>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                </Tabs>
              </TabsContent>

              <TabsContent value="breakdown">
                {comparisonData.departmentBreakdown && (
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                    {comparisonData.departmentBreakdown.map((dept) => (
                      <div key={dept.department} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                        <span className="font-medium">{dept.department}</span>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-xs text-slate-400">Current</p>
                            <p className="font-medium">{formatCurrency(dept.currentNet)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-400">Previous</p>
                            <p className="font-medium">{formatCurrency(dept.previousNet)}</p>
                          </div>
                          <Badge 
                            variant={dept.change > 0 ? "default" : "secondary"} 
                            className={cn(
                              "min-w-20",
                              dept.change > 0 && "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
                              dept.change < 0 && "bg-rose-100 text-rose-700 hover:bg-rose-100"
                            )}
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
                            <span className="font-medium">{formatCurrency(comparisonData.current.totalGross)}</span>
                          </p>
                          <p className="flex justify-between">
                            <span className="text-slate-500">Net Pay:</span>
                            <span className="font-medium">{formatCurrency(comparisonData.current.totalNet)}</span>
                          </p>
                          <p className="flex justify-between">
                            <span className="text-slate-500">Avg per Employee:</span>
                            <span className="font-medium">{formatCurrency(comparisonData.current.avgPerEmployee)}</span>
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
                            <span className="font-medium">{formatCurrency(comparisonData.previous.totalGross)}</span>
                          </p>
                          <p className="flex justify-between">
                            <span className="text-slate-500">Net Pay:</span>
                            <span className="font-medium">{formatCurrency(comparisonData.previous.totalNet)}</span>
                          </p>
                          <p className="flex justify-between">
                            <span className="text-slate-500">Avg per Employee:</span>
                            <span className="font-medium">{formatCurrency(comparisonData.previous.avgPerEmployee)}</span>
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