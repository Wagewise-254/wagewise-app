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
}

interface ChangedEmployee extends EmployeeData {
  previous: EmployeeData;
  changes: {
    grossPay: number;
    netPay: number;
    grossPayPercent: number;
    netPayPercent: number;
  };
}

interface ComparisonData {
  current: {
    totalGross: number;
    totalNet: number;
    employeeCount: number;
  };
  previous: {
    totalGross: number;
    totalNet: number;
    employeeCount: number;
  };
  differences: {
    grossChange: number;
    netChange: number;
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

interface StatCardProps {
  title: string;
  current: number;
  previous: number;
  change: number;
  format?: "currency" | "number";
}

interface EmployeeRowProps {
  employee: EmployeeData | ChangedEmployee;
  showChange?: boolean;
  variant?: "default" | "new" | "removed";
}

interface ChangeDisplay {
  icon: typeof TrendingUp | typeof TrendingDown | typeof Minus;
  color: string;
  bgColor: string;
  sign: string;
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
        { headers, params: { limit: 10 } }
      );
      
      const runs: PayrollRun[] = Array.isArray(response.data) ? response.data : response.data?.data || [];
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
    if (!selectedRunId || !companyId || !currentRunId) return;
    
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/company/${companyId}/payroll/runs/compare/${currentRunId}/${selectedRunId}`,
        { headers }
      );
      setComparisonData(response.data);
      toast.success("Comparison loaded");
    } catch (error) {
      console.error("Failed to compare payroll runs:", error);
      toast.error("Failed to compare payroll runs");
    } finally {
      setLoading(false);
    }
  }, [selectedRunId, companyId, currentRunId, headers]);

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
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }, []);

  const getChangeDisplay = useCallback((change: number): ChangeDisplay => {
    const isPositive = change > 0;
    const isNegative = change < 0;
    return {
      icon: isPositive ? TrendingUp : isNegative ? TrendingDown : Minus,
      color: isPositive ? "text-emerald-600" : isNegative ? "text-rose-600" : "text-slate-400",
      bgColor: isPositive ? "bg-emerald-50 border-emerald-200" : isNegative ? "bg-rose-50 border-rose-200" : "bg-slate-50 border-slate-200",
      sign: isPositive ? "+" : "",
    };
  }, []);

  const getInitials = (name: string) => {
    return name.split(" ").map(word => word[0]).join("").toUpperCase().slice(0, 2);
  };

  const StatCard = ({ title, current, previous, change, format = "currency" }: StatCardProps) => {
    const { icon: Icon, color, sign } = getChangeDisplay(change);
    const formattedValue = format === "currency" ? formatCurrency : (v: number) => v;
    
    return (
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
          <div className="flex items-center justify-between mt-2">
            <div>
              <p className="text-xs text-slate-400">Current</p>
              <p className="text-lg font-semibold text-slate-900">{formattedValue(current)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Previous</p>
              <p className="text-lg font-semibold text-slate-900">{formattedValue(previous)}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <Icon className={cn("h-3.5 w-3.5", color)} />
            <span className={cn("text-sm font-medium", color)}>
              {sign}{change}%
            </span>
          </div>
        </CardContent>
      </Card>
    );
  };

  const EmployeeRow = ({ employee, showChange = false, variant = "default" }: EmployeeRowProps) => {
    const isChangedEmployee = (emp: EmployeeData | ChangedEmployee): emp is ChangedEmployee => {
      return 'changes' in emp && 'previous' in emp;
    };

    const changes = isChangedEmployee(employee) ? employee.changes : null;
    
    return (
      <TableRow className="hover:bg-slate-50/50">
        <TableCell className="py-2.5">
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-[10px] font-medium bg-slate-100 text-slate-600">
                {getInitials(employee.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-slate-900">{employee.name}</p>
              <p className="text-xs text-slate-400">{employee.employeeNumber}</p>
            </div>
          </div>
        </TableCell>
        <TableCell className="py-2.5 text-sm text-slate-600">{employee.department || "—"}</TableCell>
        <TableCell className="py-2.5 text-sm text-slate-600">{employee.jobTitle || "—"}</TableCell>
        <TableCell className="py-2.5 text-right text-sm font-medium text-slate-900">
          {formatCurrency(employee.grossPay)}
        </TableCell>
        <TableCell className="py-2.5 text-right">
          <span className={cn(
            "text-sm font-semibold",
            variant === "new" ? "text-emerald-600" : variant === "removed" ? "text-rose-600" : "text-slate-900"
          )}>
            {formatCurrency(employee.netPay)}
          </span>
          {showChange && changes && (
            <div className={cn("text-xs", getChangeDisplay(changes.netPayPercent).color)}>
              {changes.netPayPercent > 0 ? "+" : ""}{changes.netPayPercent}%
            </div>
          )}
        </TableCell>
        {showChange && (
          <TableCell className="py-2.5 text-right">
            {changes && (
              <Badge variant="outline" className={getChangeDisplay(changes.netPay).bgColor}>
                {changes.netPay > 0 ? "+" : ""}{formatCurrency(changes.netPay)}
              </Badge>
            )}
          </TableCell>
        )}
      </TableRow>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 h-8 text-xs">
          <ArrowRightLeft className="h-3.5 w-3.5" />
          Compare
        </Button>
      </DialogTrigger>
      
      <DialogContent className="min-w-4xl w-[90vw] max-h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-3 border-b border-slate-100">
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4 text-slate-500" />
            Compare Payroll Runs
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Run Selector */}
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs text-slate-500">Select previous run</Label>
              <Select value={selectedRunId} onValueChange={setSelectedRunId} disabled={fetchingRuns}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder={fetchingRuns ? "Loading..." : "Choose a payroll run"} />
                </SelectTrigger>
                <SelectContent>
                  {previousRuns.map((run) => (
                    <SelectItem key={run.id} value={run.id} className="text-sm">
                      {run.payroll_month} {run.payroll_year} · {formatCurrency(run.total_net_pay)} · {run.employee_count} employees
                    </SelectItem>
                  ))}
                  {previousRuns.length === 0 && !fetchingRuns && (
                    <SelectItem value="none" disabled>No previous runs found</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={fetchComparison} 
              disabled={!selectedRunId || loading}
              size="sm"
              className="h-9 px-4"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Compare"}
            </Button>
          </div>

          {comparisonData && (
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-9">
                <TabsTrigger value="summary" className="text-xs">Summary</TabsTrigger>
                <TabsTrigger value="employees" className="text-xs relative">
                  Employees
                  {comparisonData.employeeComparison.stats.changed > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-700 rounded-full">
                      {comparisonData.employeeComparison.stats.changed}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="departments" className="text-xs">Departments</TabsTrigger>
              </TabsList>

              {/* Summary Tab */}
              <TabsContent value="summary" className="mt-4 space-y-4">
                {/* Employee Stats */}
                <div className="grid grid-cols-4 gap-3">
                  <Card className="border-slate-200 shadow-sm">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-xs text-slate-500">Unchanged</span>
                      </div>
                      <span className="font-semibold text-sm">{comparisonData.employeeComparison.stats.unchanged}</span>
                    </CardContent>
                  </Card>
                  <Card className="border-slate-200 shadow-sm">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-3.5 w-3.5 text-amber-500" />
                        <span className="text-xs text-slate-500">Changed</span>
                      </div>
                      <span className="font-semibold text-sm">{comparisonData.employeeComparison.stats.changed}</span>
                    </CardContent>
                  </Card>
                  <Card className="border-slate-200 shadow-sm">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserPlus className="h-3.5 w-3.5 text-blue-500" />
                        <span className="text-xs text-slate-500">New</span>
                      </div>
                      <span className="font-semibold text-sm">{comparisonData.employeeComparison.stats.new}</span>
                    </CardContent>
                  </Card>
                  <Card className="border-slate-200 shadow-sm">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserMinus className="h-3.5 w-3.5 text-rose-500" />
                        <span className="text-xs text-slate-500">Removed</span>
                      </div>
                      <span className="font-semibold text-sm">{comparisonData.employeeComparison.stats.removed}</span>
                    </CardContent>
                  </Card>
                </div>

                {/* Financial Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <StatCard 
                    title="Gross Pay" 
                    current={comparisonData.current.totalGross}
                    previous={comparisonData.previous.totalGross}
                    change={comparisonData.differences.grossChange}
                  />
                  <StatCard 
                    title="Net Pay" 
                    current={comparisonData.current.totalNet}
                    previous={comparisonData.previous.totalNet}
                    change={comparisonData.differences.netChange}
                  />
                  <StatCard 
                    title="Employees" 
                    current={comparisonData.current.employeeCount}
                    previous={comparisonData.previous.employeeCount}
                    change={comparisonData.differences.countChange}
                    format="number"
                  />
                </div>
              </TabsContent>

              {/* Employees Tab */}
              <TabsContent value="employees" className="mt-4">
                <Tabs defaultValue="changed" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 h-8">
                    <TabsTrigger value="changed" className="text-xs">
                      Changed ({comparisonData.employeeComparison.changed.length})
                    </TabsTrigger>
                    <TabsTrigger value="new" className="text-xs">
                      New ({comparisonData.employeeComparison.new.length})
                    </TabsTrigger>
                    <TabsTrigger value="removed" className="text-xs">
                      Removed ({comparisonData.employeeComparison.removed.length})
                    </TabsTrigger>
                    <TabsTrigger value="unchanged" className="text-xs">
                      Unchanged ({comparisonData.employeeComparison.unchanged.length})
                    </TabsTrigger>
                  </TabsList>

                  <div className="mt-3 border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="text-xs font-medium w-70">Employee</TableHead>
                          <TableHead className="text-xs font-medium w-37.5">Department</TableHead>
                          <TableHead className="text-xs font-medium w-37.5">Job Title</TableHead>
                          <TableHead className="text-xs font-medium text-right w-30">Gross</TableHead>
                          <TableHead className="text-xs font-medium text-right w-30">Net</TableHead>
                          {comparisonData.employeeComparison.changed.length > 0 && (
                            <TableHead className="text-xs font-medium text-right w-30">Change</TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TabsContent value="changed" className="mt-0">
                          {comparisonData.employeeComparison.changed.map((emp) => (
                            <EmployeeRow key={emp.id} employee={emp} showChange />
                          ))}
                          {comparisonData.employeeComparison.changed.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={6} className="h-24 text-center text-slate-400">
                                No changes
                              </TableCell>
                            </TableRow>
                          )}
                        </TabsContent>
                        <TabsContent value="new" className="mt-0">
                          {comparisonData.employeeComparison.new.map((emp) => (
                            <EmployeeRow key={emp.id} employee={emp} variant="new" />
                          ))}
                          {comparisonData.employeeComparison.new.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={5} className="h-24 text-center text-slate-400">
                                No new employees
                              </TableCell>
                            </TableRow>
                          )}
                        </TabsContent>
                        <TabsContent value="removed" className="mt-0">
                          {comparisonData.employeeComparison.removed.map((emp) => (
                            <EmployeeRow key={emp.id} employee={emp} variant="removed" />
                          ))}
                          {comparisonData.employeeComparison.removed.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={5} className="h-24 text-center text-slate-400">
                                No removed employees
                              </TableCell>
                            </TableRow>
                          )}
                        </TabsContent>
                        <TabsContent value="unchanged" className="mt-0">
                          {comparisonData.employeeComparison.unchanged.slice(0, 15).map((emp) => (
                            <EmployeeRow key={emp.id} employee={emp} />
                          ))}
                          {comparisonData.employeeComparison.unchanged.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={5} className="h-24 text-center text-slate-400">
                                No unchanged employees
                              </TableCell>
                            </TableRow>
                          )}
                          {comparisonData.employeeComparison.unchanged.length > 15 && (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-xs text-slate-400 py-2">
                                +{comparisonData.employeeComparison.unchanged.length - 15} more
                              </TableCell>
                            </TableRow>
                          )}
                        </TabsContent>
                      </TableBody>
                    </Table>
                  </div>
                </Tabs>
              </TabsContent>

              {/* Departments Tab */}
              <TabsContent value="departments" className="mt-4">
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="text-xs font-medium w-75">Department</TableHead>
                        <TableHead className="text-xs font-medium text-right w-45">Current</TableHead>
                        <TableHead className="text-xs font-medium text-right w-45">Previous</TableHead>
                        <TableHead className="text-xs font-medium text-right w-35">Change</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {comparisonData.departmentBreakdown?.map((dept) => {
                        const { icon: Icon, bgColor, sign } = getChangeDisplay(dept.change);
                        return (
                          <TableRow key={dept.department} className="hover:bg-slate-50/50">
                            <TableCell className="py-2.5 font-medium text-sm">{dept.department}</TableCell>
                            <TableCell className="py-2.5 text-right text-sm">{formatCurrency(dept.currentNet)}</TableCell>
                            <TableCell className="py-2.5 text-right text-sm text-slate-500">{formatCurrency(dept.previousNet)}</TableCell>
                            <TableCell className="py-2.5 text-right">
                              <Badge variant="outline" className={cn("gap-1 font-medium", bgColor)}>
                                <Icon className="h-3 w-3" />
                                {sign}{dept.change}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {(!comparisonData.departmentBreakdown || comparisonData.departmentBreakdown.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center text-slate-400">
                            No department data
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)} className="h-8 text-xs">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}