// src/pages/company/payroll/details/AllowancesDetailPage.tsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePayrollDetails } from '@/pages/company/payroll/reviews/hooks/usePayrollReview';
//import type { PayrollDetail, AllowanceDetail } from '@/pages/company/payroll/reviews/types';
import { 
  Search, 
  RefreshCw, 
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Award,
} from 'lucide-react';
import { cn } from '@/lib/utils';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { AllowanceDetail } from '@/pages/company/payroll/reviews/types';

// Type for the transformed employee allowance data
interface EmployeeAllowanceData {
  id: string;
  employee_name: string;
  employee_number: string;
  job_title: string | null;
  department_name: string | null;
  basic_salary: number;
  gross_pay: number;
  total_allowances: number;
  allowances_details: AllowanceDetail[];
}

export default function AllowancesDetailPage() {
  const { companyId, payrollRunId } = useParams<{ companyId: string; payrollRunId: string }>();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showSearch, setShowSearch] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeAllowanceData | null>(null);

  // Use the existing hook from the review page
  const {
    data: payrollDetails,
    isLoading,
    refetch,
  } = usePayrollDetails(companyId!, payrollRunId!);

  // Transform the data for our view
  const employees = (payrollDetails || [])
    .filter(emp => emp.is_eligible)
    .map((emp): EmployeeAllowanceData => ({
      id: emp.id,
      employee_name: emp.employee_name,
      employee_number: emp.employee_number,
      job_title: emp.job_title,
      department_name: emp.department_name,
      basic_salary: emp.basic_salary || 0,
      gross_pay: emp.gross_pay || 0,
      total_allowances: emp.total_allowances || 0,
      allowances_details: emp.allowances_details || [],
    }));

  // Filter employees
  const filteredEmployees = employees.filter((emp) => {
    const matchesType = filterType === 'all' || 
      emp.allowances_details?.some(a => a.type === filterType);
    
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      emp.employee_name?.toLowerCase().includes(query) ||
      emp.employee_number?.toLowerCase().includes(query) ||
      emp.job_title?.toLowerCase().includes(query) ||
      emp.department_name?.toLowerCase().includes(query);
    
    return matchesType && matchesSearch;
  });

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredEmployees.length);
  const currentEmployees = filteredEmployees.slice(startIndex, endIndex);

  const totalAllowances = employees.reduce((sum, e) => sum + e.total_allowances, 0);

  const getAllowanceTypeColor = (type: string): string => {
    return type === 'CASH' ? 'text-emerald-600 bg-emerald-50' : 'text-blue-600 bg-blue-50';
  };

  const handleViewDetails = (employee: EmployeeAllowanceData) => {
    setSelectedEmployee(employee);
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleRefresh = async () => {
    await refetch();
    toast.info('Refreshing allowance data...');
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
                  Allowances
                </h1>
                <p className="text-sm text-slate-400">
                  Total Allowances: KES {totalAllowances.toLocaleString()}
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

            {/* Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400 hidden sm:block" />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-36 rounded-sm border-slate-200 h-8 text-xs">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="NON_CASH">Non-Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                  Basic
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">
                  Allowances
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">
                  Gross
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Types
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {currentEmployees.map((employee) => {
                const hasCash = employee.allowances_details?.some(a => a.type === 'CASH');
                const hasNonCash = employee.allowances_details?.some(a => a.type === 'NON_CASH');

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
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <span className="text-sm text-slate-600">
                        KES {employee.basic_salary?.toLocaleString() || '0'}
                      </span>
                    </TableCell>

                    <TableCell className="text-right">
                      <span className="font-semibold text-[#7F5EFD] text-sm">
                        KES {employee.total_allowances?.toLocaleString() || '0'}
                      </span>
                    </TableCell>

                    <TableCell className="text-right">
                      <span className="font-medium text-slate-900 text-sm">
                        KES {employee.gross_pay?.toLocaleString() || '0'}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="flex gap-1.5">
                        {hasCash && (
                          <Badge className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                            Cash
                          </Badge>
                        )}
                        {hasNonCash && (
                          <Badge className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                            Non-Cash
                          </Badge>
                        )}
                      </div>
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
            <Award className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No allowances found</p>
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

      {/* Allowance Details Sheet */}
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
              <div className="grid grid-cols-3 gap-2">
                <Card className="p-3 border-slate-200 shadow-none">
                  <p className="text-xs text-slate-500">Basic Salary</p>
                  <p className="font-semibold text-slate-900 mt-1">
                    KES {selectedEmployee.basic_salary?.toLocaleString() || '0'}
                  </p>
                </Card>
                <Card className="p-3 border-[#7F5EFD]/20 bg-[#7F5EFD]/5 shadow-none">
                  <p className="text-xs text-[#7F5EFD]">Total Allowances</p>
                  <p className="font-semibold text-[#7F5EFD] mt-1">
                    +KES {selectedEmployee.total_allowances?.toLocaleString() || '0'}
                  </p>
                </Card>
                <Card className="p-3 border-emerald-200 bg-emerald-50/50 shadow-none">
                  <p className="text-xs text-emerald-700">Gross Pay</p>
                  <p className="font-semibold text-emerald-700 mt-1">
                    KES {selectedEmployee.gross_pay?.toLocaleString() || '0'}
                  </p>
                </Card>
              </div>

              <Separator />

              {/* Allowance Details */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Award className="h-4 w-4 text-[#7F5EFD]" />
                  Allowance Breakdown
                </h3>
                <div className="space-y-2">
                  {selectedEmployee.allowances_details?.map((allowance, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-sm hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex flex-col">
                        <p className="font-medium text-sm text-slate-900">
                          {allowance.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            className={cn(
                              'text-[10px] px-1.5 py-0 h-4 border-0',
                              getAllowanceTypeColor(allowance.type)
                            )}
                          >
                            {allowance.type}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 h-4 bg-slate-100 border-0"
                          >
                            {allowance.is_taxable ? 'Taxable' : 'Non-taxable'}
                          </Badge>
                          {allowance.code && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 h-4 bg-slate-100 border-0"
                            >
                              {allowance.code}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="font-medium text-sm text-emerald-600">
                        +KES {allowance.value.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}