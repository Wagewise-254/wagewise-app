// src/pages/company/payroll/details/PaymentMethodsDetailPage.tsx

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePayrollDetails } from '@/pages/company/payroll/reviews/hooks/usePayrollReview';
import { 
  Search, 
  RefreshCw, 
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CreditCard,
  Landmark,
  Smartphone,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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

interface PaymentMethodData {
  id: string;
  employee_name: string;
  employee_number: string;
  job_title: string | null;
  department_name: string | null;
  payment_method: string | null;
  bank_name: string | null;
  branch_name: string | null;
  account_name: string | null;
  account_number: string | null;
  mobile_phone: string | null;
  net_pay: number;
}

const getPaymentIcon = (method: string | null) => {
  if (!method) return <Wallet className="h-4 w-4" />;
  const lower = method.toLowerCase();
  if (lower.includes('bank') || lower.includes('transfer')) return <Landmark className="h-4 w-4" />;
  if (lower.includes('mpesa') || lower.includes('mobile')) return <Smartphone className="h-4 w-4" />;
  if (lower.includes('cash')) return <Wallet className="h-4 w-4" />;
  return <CreditCard className="h-4 w-4" />;
};

export default function PaymentMethodsDetailPage() {
  const { companyId, payrollRunId } = useParams<{ companyId: string; payrollRunId: string }>();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const {
    data: payrollDetails,
    isLoading,
    refetch,
  } = usePayrollDetails(companyId!, payrollRunId!);

  const employees = (payrollDetails || [])
    .filter(emp => emp.is_eligible)
    .map((emp): PaymentMethodData => ({
      id: emp.id,
      employee_name: emp.employee_name,
      employee_number: emp.employee_number,
      job_title: emp.job_title,
      department_name: emp.department_name,
      payment_method: emp.payment_method,
      bank_name: emp.bank_name,
      branch_name: emp.branch_name,
      account_name: emp.account_name,
      account_number: emp.account_number,
      mobile_phone: emp.mobile_phone,
      net_pay: emp.net_pay || 0,
    }));

  const filteredEmployees = employees.filter((emp) => {
    const query = searchQuery.toLowerCase();
    return (
      emp.employee_name?.toLowerCase().includes(query) ||
      emp.employee_number?.toLowerCase().includes(query) ||
      emp.job_title?.toLowerCase().includes(query) ||
      emp.department_name?.toLowerCase().includes(query) ||
      emp.bank_name?.toLowerCase().includes(query) ||
      emp.account_name?.toLowerCase().includes(query) ||
      emp.account_number?.toLowerCase().includes(query) ||
      emp.mobile_phone?.toLowerCase().includes(query)
    );
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
    toast.info('Refreshing payment methods...');
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
      <section className="h-full pb-4 bg-white mx-6">
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
                  Payment Methods
                </h1>
                <p className="text-sm text-slate-400">
                  {employees.length} employees
                </p>
              </div>
            </div>
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
                    placeholder="Search..."
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
                  <TooltipContent side="bottom">Search</TooltipContent>
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
                  Method
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Bank / Mobile
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Account
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">
                  Net Pay
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {currentEmployees.map((employee) => (
                <TableRow
                  key={employee.id}
                  className="hover:bg-slate-50/70 border-slate-100"
                >
                  <TableCell className="py-3">
                    <div>
                      <p className="font-medium text-slate-900 text-sm">
                        {employee.employee_name || 'Unknown'}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {employee.employee_number}
                        {employee.job_title && ` · ${employee.job_title}`}
                        {employee.department_name && ` · ${employee.department_name}`}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-slate-50 border border-slate-200 rounded-sm">
                        {getPaymentIcon(employee.payment_method)}
                      </div>
                      <span className="text-sm text-slate-700">
                        {employee.payment_method || 'Not set'}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    {employee.bank_name ? (
                      <div>
                        <p className="text-sm text-slate-900">{employee.bank_name}</p>
                        {employee.branch_name && (
                          <p className="text-xs text-slate-500">{employee.branch_name}</p>
                        )}
                      </div>
                    ) : employee.mobile_phone ? (
                      <div>
                        <p className="text-sm text-slate-900">M-Pesa</p>
                        <p className="text-xs text-slate-500">{employee.mobile_phone}</p>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">—</span>
                    )}
                  </TableCell>

                  <TableCell>
                    {employee.account_name ? (
                      <div>
                        <p className="text-sm text-slate-900">{employee.account_name}</p>
                        {employee.account_number && (
                          <p className="text-xs text-slate-500">****{employee.account_number.slice(-4)}</p>
                        )}
                      </div>
                    ) : employee.mobile_phone ? (
                      <div>
                        <p className="text-sm text-slate-900">Mobile Wallet</p>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">—</span>
                    )}
                  </TableCell>

                  <TableCell className="text-right">
                    <span className="font-semibold text-emerald-600 text-sm">
                      KES {employee.net_pay?.toLocaleString() || '0'}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredEmployees.length === 0 && (
          <div className="text-center py-12">
            <CreditCard className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No employees found</p>
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