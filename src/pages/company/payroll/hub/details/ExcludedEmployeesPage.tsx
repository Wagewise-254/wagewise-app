// src/pages/company/payroll/employees/ExcludedEmployeesPage.tsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePayrollDetails } from '@/pages/company/payroll/reviews/hooks/usePayrollReview';
//import type { PayrollDetail } from '@/pages/company/payroll/reviews/types';
import { 
  Search, 
  RefreshCw, 
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  UserX,
  AlertCircle,
  Mail,
  Phone,
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
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

// Type for excluded employee data
interface ExcludedEmployeeData {
  id: string;
  employee_number: string;
  employee_name: string;
  email: string;
  phone_number: string | null;
  job_title: string | null;
  department_name: string | null;
  reason: string;
  basic_salary: number;
}

export default function ExcludedEmployeesPage() {
  const { companyId, payrollRunId } = useParams<{ companyId: string; payrollRunId: string }>();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Use the existing hook from the review page
  const {
    data: payrollDetails,
    isLoading,
    refetch,
  } = usePayrollDetails(companyId!, payrollRunId!);

  // Transform the data for our view
  const employees = (payrollDetails || [])
    .filter(emp => !emp.is_eligible)
    .map((emp): ExcludedEmployeeData => ({
      id: emp.id,
      employee_number: emp.employee_number,
      employee_name: emp.employee_name,
      email: emp.employee?.email || '',
      phone_number: emp.mobile_phone || null,
      job_title: emp.job_title,
      department_name: emp.department_name,
      reason: emp.ineligibility_reason || 'Not eligible for this payroll',
      basic_salary: emp.basic_salary || 0,
    }));

  const filteredEmployees = employees.filter((emp) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      emp.employee_name?.toLowerCase().includes(query) ||
      emp.employee_number?.toLowerCase().includes(query) ||
      emp.job_title?.toLowerCase().includes(query) ||
      emp.department_name?.toLowerCase().includes(query) ||
      emp.reason?.toLowerCase().includes(query);
    
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredEmployees.length);
  const currentEmployees = filteredEmployees.slice(startIndex, endIndex);

  const handleBack = () => {
    navigate(-1);
  };

  const handleRefresh = async () => {
    await refetch();
    toast.info('Refreshing excluded employees data...');
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
                  Excluded Employees
                </h1>
                <p className="text-sm text-slate-400">
                  {employees.length} employees excluded from this payroll
                </p>
              </div>
            </div>
          </div>
          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
            <UserX className="h-3 w-3 mr-1.5" />
            {employees.length} excluded
          </Badge>
        </header>

        {/* Info Alert */}
        {employees.length > 0 && (
          <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-sm flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-900">Excluded Employees</p>
              <p className="text-xs text-amber-700 mt-0.5">
                These employees are not included in this payroll run. They may need to be added or their eligibility status updated.
              </p>
            </div>
          </div>
        )}

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
                <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Department
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Reason
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">
                  Basic Salary
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Contact
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {currentEmployees.map((employee) => (
                <TableRow
                  key={employee.id}
                  className="hover:bg-slate-50/70 border-slate-100 bg-amber-50/30"
                >
                  <TableCell className="py-3">
                    <div>
                      <p className="font-medium text-slate-900 text-sm">
                        {employee.employee_name}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {employee.employee_number}
                        {employee.job_title && ` · ${employee.job_title}`}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="text-sm text-slate-600">
                      {employee.department_name || 'N/A'}
                    </span>
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {employee.reason || 'No reason provided'}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right">
                    <span className="text-sm text-slate-600">
                      KES {employee.basic_salary?.toLocaleString() || '0'}
                    </span>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-0.5">
                      {employee.email && (
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Mail className="h-3 w-3" />
                          {employee.email}
                        </div>
                      )}
                      {employee.phone_number && (
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Phone className="h-3 w-3" />
                          {employee.phone_number}
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredEmployees.length === 0 && (
          <div className="text-center py-12">
            <UserX className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">
              {employees.length === 0 
                ? 'No excluded employees in this payroll' 
                : 'No employees match your search'}
            </p>
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
    </div>
  );
}