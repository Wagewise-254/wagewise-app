// src/pages/company/payroll/details/DeductionsDetailPage.tsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePayrollDetails } from '@/pages/company/payroll/reviews/hooks/usePayrollReview';
//import type { PayrollDetail, DeductionDetail } from '@/pages/company/payroll/reviews/types';
import { 
  Search, 
  RefreshCw, 
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Receipt,
  Building,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { DeductionDetail } from '@/pages/company/payroll/reviews/types';

// Type for the transformed employee deduction data
interface EmployeeDeductionData {
  id: string;
  employee_name: string;
  employee_number: string;
  job_title: string | null;
  department_name: string | null;
  gross_pay: number;
  net_pay: number;
  paye_tax: number;
  nssf_deduction: number;
  shif_deduction: number;
  helb_deduction: number;
  housing_levy_deduction: number;
  total_deductions: number;
  total_statutory_deductions: number;
  total_other_deductions: number;
  absent_days: number;
  absent_days_deduction: number;
  deductions_details: DeductionDetail[];
}

export default function DeductionsDetailPage() {
  const { companyId, payrollRunId } = useParams<{ companyId: string; payrollRunId: string }>();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeDeductionData | null>(null);

  // Use the existing hook from the review page
  const {
    data: payrollDetails,
    isLoading,
    refetch,
  } = usePayrollDetails(companyId!, payrollRunId!);

  // Transform the data for our view
  const employees = (payrollDetails || [])
    .filter(emp => emp.is_eligible)
    .map((emp): EmployeeDeductionData => ({
      id: emp.id,
      employee_name: emp.employee_name,
      employee_number: emp.employee_number,
      job_title: emp.job_title,
      department_name: emp.department_name,
      gross_pay: emp.gross_pay || 0,
      net_pay: emp.net_pay || 0,
      paye_tax: emp.paye_tax || 0,
      nssf_deduction: emp.nssf_deduction || 0,
      shif_deduction: emp.shif_deduction || 0,
      helb_deduction: emp.helb_deduction || 0,
      housing_levy_deduction: emp.housing_levy_deduction || 0,
      total_deductions: emp.total_deductions || 0,
      total_statutory_deductions: emp.total_statutory_deductions || 0,
      total_other_deductions: emp.total_other_deductions || 0,
      absent_days: emp.absent_days || 0,
      absent_days_deduction: emp.absent_days_deduction || 0,
      deductions_details: emp.deductions_details || [],
    }));

  // Filter employees
  const filteredEmployees = employees.filter((emp) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      emp.employee_name?.toLowerCase().includes(query) ||
      emp.employee_number?.toLowerCase().includes(query) ||
      emp.job_title?.toLowerCase().includes(query) ||
      emp.department_name?.toLowerCase().includes(query);
    
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredEmployees.length);
  const currentEmployees = filteredEmployees.slice(startIndex, endIndex);

  const totalDeductions = employees.reduce((sum, e) => sum + e.total_deductions, 0);
  const totalStatutory = employees.reduce((sum, e) => sum + e.total_statutory_deductions, 0);
  const totalOther = employees.reduce((sum, e) => sum + e.total_other_deductions, 0);

  const handleViewDetails = (employee: EmployeeDeductionData) => {
    setSelectedEmployee(employee);
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleRefresh = async () => {
    await refetch();
    toast.info('Refreshing deduction data...');
  };

  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto">
        <section className="h-full pb-4 bg-white border border-slate-200 rounded-md">
          <div className="px-6 pt-5 pb-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div>
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32 mt-1" />
              </div>
            </div>
          </div>
          <div className="px-6">
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <section className="h-full pb-4 bg-white border border-slate-200 rounded-md">
        {/* Header */}
        <header className="flex items-start justify-between px-6 pt-5 pb-3 border-b border-slate-200">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="h-8 w-8 p-0 hover:bg-slate-100"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">
                  Deductions
                </h1>
                <p className="text-sm text-slate-400">
                  Total Deductions: KES {totalDeductions.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {employees.length} employees
            </Badge>
          </div>
        </header>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3 px-6 py-4 border-b border-slate-200">
          <Card className="p-3 border-slate-200 shadow-none">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-xs text-slate-500">Total Deductions</p>
                <p className="font-semibold text-red-600">
                  KES {totalDeductions.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-3 border-slate-200 shadow-none">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-amber-500" />
              <div>
                <p className="text-xs text-slate-500">Statutory</p>
                <p className="font-semibold text-amber-600">
                  KES {totalStatutory.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-3 border-slate-200 shadow-none">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-xs text-slate-500">Other Deductions</p>
                <p className="font-semibold text-blue-600">
                  KES {totalOther.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Table Controls */}
        <div className="flex items-center justify-between gap-3 px-6 py-3">
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              {showSearch ? (
                <div className="relative animate-in slide-in-from-left-2 fade-in duration-200">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search employees..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onBlur={() => {
                      if (!searchQuery) setShowSearch(false);
                    }}
                    className="pl-8 h-8 w-64 text-sm bg-white border-slate-200 rounded-md focus-visible:ring-1 focus-visible:ring-[#7F5EFD]"
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
                  <TooltipContent side="bottom">Search employees</TooltipContent>
                </Tooltip>
              )}
            </div>

            {/* Refresh */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 cursor-pointer"
                  onClick={handleRefresh}
                >
                  <RefreshCw className="h-4 w-4 text-slate-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Refresh</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-auto px-6">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="hover:bg-slate-50 border-slate-200">
                <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Employee
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">
                  Gross
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">
                  Statutory
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">
                  Other
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">
                  Total
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">
                  Net
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {currentEmployees.map((employee) => {
                const statutoryTotal = employee.paye_tax + employee.nssf_deduction + 
                  employee.shif_deduction + employee.housing_levy_deduction;

                return (
                  <TableRow
                    key={employee.id}
                    className="hover:bg-slate-50/70 border-slate-100"
                  >
                    <TableCell className="py-3">
                      <div>
                        <p className="font-medium text-slate-900 text-sm">
                          {employee.employee_name || 'Unknown Employee'}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {employee.employee_number} · {employee.job_title || 'N/A'}
                          {employee.department_name && ` · ${employee.department_name}`}
                        </p>
                        {employee.absent_days > 0 && (
                          <p className="text-xs text-amber-600 mt-0.5">
                            ⚠️ {employee.absent_days} absent days
                          </p>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <span className="text-sm text-slate-600">
                        KES {employee.gross_pay?.toLocaleString() || '0'}
                      </span>
                    </TableCell>

                    <TableCell className="text-right">
                      <span className="text-sm text-amber-600">
                        KES {statutoryTotal.toLocaleString()}
                      </span>
                    </TableCell>

                    <TableCell className="text-right">
                      <span className="text-sm text-blue-600">
                        KES {employee.total_other_deductions?.toLocaleString() || '0'}
                      </span>
                    </TableCell>

                    <TableCell className="text-right">
                      <span className="font-semibold text-red-600 text-sm">
                        KES {employee.total_deductions?.toLocaleString() || '0'}
                      </span>
                    </TableCell>

                    <TableCell className="text-right">
                      <span className="font-semibold text-emerald-600 text-sm">
                        KES {employee.net_pay?.toLocaleString() || '0'}
                      </span>
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[#7F5EFD] hover:text-[#6b4de0] hover:bg-[#7F5EFD]/10 rounded-sm h-8"
                        onClick={() => handleViewDetails(employee)}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1.5" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {filteredEmployees.length === 0 && (
          <div className="text-center py-12">
            <Receipt className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No deductions found</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200">
            <p className="text-xs text-slate-400">
              Showing {startIndex + 1} to {endIndex} of {filteredEmployees.length}
            </p>
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="h-7 w-7 p-0"
              >
                <ChevronsLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-7 w-7 p-0"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs text-slate-600 px-2">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-7 w-7 p-0"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="h-7 w-7 p-0"
              >
                <ChevronsRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* Deduction Details Sheet */}
      {selectedEmployee && (
        <Sheet
          open={!!selectedEmployee}
          onOpenChange={() => setSelectedEmployee(null)}
        >
          <SheetContent className="w-full sm:max-w-xl overflow-y-auto p-6">
            <SheetHeader>
              <SheetTitle className="text-xl">
                {selectedEmployee.employee_name || 'Unknown Employee'}
              </SheetTitle>
              <SheetDescription>
                {selectedEmployee.employee_number} · {selectedEmployee.job_title || 'N/A'}
                {selectedEmployee.department_name && ` · ${selectedEmployee.department_name}`}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-2">
                <Card className="p-3 border-slate-200 shadow-none">
                  <p className="text-xs text-slate-500">Gross Pay</p>
                  <p className="font-semibold text-slate-900 mt-1">
                    KES {selectedEmployee.gross_pay?.toLocaleString() || '0'}
                  </p>
                </Card>
                <Card className="p-3 border-emerald-200 bg-emerald-50/50 shadow-none">
                  <p className="text-xs text-emerald-700">Net Pay</p>
                  <p className="font-semibold text-emerald-700 mt-1">
                    KES {selectedEmployee.net_pay?.toLocaleString() || '0'}
                  </p>
                </Card>
                <Card className="p-3 border-red-200 bg-red-50/50 shadow-none">
                  <p className="text-xs text-red-700">Total Deductions</p>
                  <p className="font-semibold text-red-700 mt-1">
                    -KES {selectedEmployee.total_deductions?.toLocaleString() || '0'}
                  </p>
                </Card>
                {selectedEmployee.absent_days > 0 && (
                  <Card className="p-3 border-amber-200 bg-amber-50/50 shadow-none">
                    <p className="text-xs text-amber-700">Absent Days</p>
                    <p className="font-semibold text-amber-700 mt-1">
                      {selectedEmployee.absent_days} days
                    </p>
                  </Card>
                )}
              </div>

              <Separator />

              {/* Deduction Breakdown */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-red-500" />
                  Deduction Breakdown
                </h3>
                <div className="space-y-2">
                  {/* Statutory Deductions */}
                  <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-sm">
                    <p className="text-xs font-medium text-amber-700 mb-2">Statutory Deductions</p>
                    <div className="space-y-1.5">
                      {selectedEmployee.paye_tax > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">PAYE Tax</span>
                          <span className="font-medium text-amber-600">
                            KES {selectedEmployee.paye_tax.toLocaleString()}
                          </span>
                        </div>
                      )}
                      {selectedEmployee.nssf_deduction > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">NSSF</span>
                          <span className="font-medium text-amber-600">
                            KES {selectedEmployee.nssf_deduction.toLocaleString()}
                          </span>
                        </div>
                      )}
                      {selectedEmployee.shif_deduction > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">SHIF</span>
                          <span className="font-medium text-amber-600">
                            KES {selectedEmployee.shif_deduction.toLocaleString()}
                          </span>
                        </div>
                      )}
                      {selectedEmployee.housing_levy_deduction > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Housing Levy</span>
                          <span className="font-medium text-amber-600">
                            KES {selectedEmployee.housing_levy_deduction.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Other Deductions */}
                  {(selectedEmployee.helb_deduction > 0 || selectedEmployee.absent_days_deduction > 0) && (
                    <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-sm">
                      <p className="text-xs font-medium text-blue-700 mb-2">Other Deductions</p>
                      <div className="space-y-1.5">
                        {selectedEmployee.helb_deduction > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">HELB Loan</span>
                            <span className="font-medium text-blue-600">
                              KES {selectedEmployee.helb_deduction.toLocaleString()}
                            </span>
                          </div>
                        )}
                        {selectedEmployee.absent_days_deduction > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">Absent Days</span>
                            <span className="font-medium text-blue-600">
                              -KES {selectedEmployee.absent_days_deduction.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Total */}
                  <div className="p-3 bg-red-50/50 border border-red-200 rounded-sm">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm text-slate-900">Total Deductions</p>
                      <p className="font-bold text-red-600">
                        -KES {selectedEmployee.total_deductions?.toLocaleString() || '0'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}