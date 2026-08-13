import { useState } from 'react';
import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Search,
  Send,
  RefreshCw,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { PayrollDetail, ReviewStatus } from '../types';
import { EmployeeSheet } from './EmployeeSheet';

interface EmployeeTableProps {
  employees: PayrollDetail[];
  isLoading: boolean;
  onRefresh: () => void;
  onApproveSelected: (ids: string[]) => void;
  onApproveAll: () => void;
  onUpdateReview: (reviewId: string, status: ReviewStatus) => void;
  isUpdating: boolean;
  isApproved: boolean;
}

const statusColors: Record<string, string> = {
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
};

const statusIcons: Record<string, React.ReactNode> = {
  APPROVED: <CheckCircle2 className="h-3.5 w-3.5" />,
  PENDING: <Clock className="h-3.5 w-3.5" />,
  REJECTED: <XCircle className="h-3.5 w-3.5" />,
};

export function EmployeeTable({
  employees,
  isLoading,
  onRefresh,
  onApproveSelected,
  onApproveAll,
  onUpdateReview,
  isUpdating,
  isApproved,
}: EmployeeTableProps) {
    // Filter to only eligible employees for review
  const eligibleEmployees = employees.filter(emp => emp.is_eligible === true);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedEmployee, setSelectedEmployee] = useState<PayrollDetail | null>(null);

  // Filter employees
  const filteredEmployees = eligibleEmployees.filter((emp) => {
    const matchesStatus = filterStatus === 'all' || emp.my_review?.status === filterStatus;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      emp.employee_name?.toLowerCase().includes(query) ||
      emp.employee_number?.toLowerCase().includes(query) ||
      emp.job_title?.toLowerCase().includes(query) ||
      emp.department_name?.toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredEmployees.length);
  const currentEmployees = filteredEmployees.slice(startIndex, endIndex);

  const statusCounts = {
    all: eligibleEmployees.length,
    PENDING: eligibleEmployees.filter((e) => e.my_review?.status === 'PENDING').length,
    APPROVED: eligibleEmployees.filter((e) => e.my_review?.status === 'APPROVED').length,
    REJECTED: eligibleEmployees.filter((e) => e.my_review?.status === 'REJECTED').length,
  };

  const handleSelectAll = () => {
    if (selectedIds.size === currentEmployees.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(currentEmployees.map((e) => e.id)));
    }
  };

  const handleSelectOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleApproveSelected = () => {
    const selectedReviewIds = eligibleEmployees
      .filter((e) => selectedIds.has(e.id))
      .map((e) => e.my_review?.id)
      .filter(Boolean) as string[];
    onApproveSelected(selectedReviewIds);
    setSelectedIds(new Set());
  };

  const isAllSelected =
    currentEmployees.length > 0 && selectedIds.size === currentEmployees.length;

  const hasPendingSelected = Array.from(selectedIds).some(
    (id) => eligibleEmployees.find((e) => e.id === id)?.my_review?.status === 'PENDING'
  );
  
   const pendingCount = eligibleEmployees.filter((e) => e.my_review?.status === 'PENDING').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 text-[#7F5EFD] animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-3 px-4">
        <div className="flex items-center  gap-2">
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
                onClick={onRefresh}
              >
                <RefreshCw className="h-4 w-4 text-slate-500" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Refresh</TooltipContent>
          </Tooltip>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400 hidden sm:block" />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-36 rounded-sm border-slate-200 h-8 text-xs">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ({statusCounts.all})</SelectItem>
                <SelectItem value="APPROVED">
                  Approved ({statusCounts.APPROVED})
                </SelectItem>
                <SelectItem value="PENDING">
                  Pending ({statusCounts.PENDING})
                </SelectItem>
                <SelectItem value="REJECTED">
                  Rejected ({statusCounts.REJECTED})
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Bulk actions */}
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs rounded-sm border-emerald-200 text-emerald-600 hover:bg-emerald-50"
              onClick={handleApproveSelected}
              disabled={!hasPendingSelected || isUpdating || isApproved}
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
              Approve ({selectedIds.size})
            </Button>
          )}

          {pendingCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs rounded-sm border-[#7F5EFD] text-[#7F5EFD] hover:bg-[#7F5EFD]/10"
                  onClick={onApproveAll}
                  disabled={isUpdating || isApproved}
                >
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                  Approve All
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Approve all pending employees ({pendingCount})
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      <div className="overflow-auto">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow className="hover:bg-slate-50 border-slate-200">
              <TableHead className="w-10 pl-5">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  disabled={isApproved}
                  className="border-slate-300"
                />
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Employee
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">
                Gross
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">
                Deductions
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">
                Net
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Status
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider text-right pr-5">
                Review
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {currentEmployees.map((employee) => {
              const reviewStatus = employee.my_review?.status || 'PENDING';
              const deductionTotal = employee.total_deductions || 0;

              return (
                <TableRow
                  key={employee.id}
                  className="hover:bg-slate-50/70 border-slate-100"
                >
                  <TableCell className="pl-5">
                    <Checkbox
                      checked={selectedIds.has(employee.id)}
                      onCheckedChange={() => handleSelectOne(employee.id)}
                      disabled={reviewStatus === 'APPROVED' || isApproved}
                      className="border-slate-300"
                    />
                  </TableCell>
                  <TableCell className="py-3">
                    <div>
                      <p className="font-medium text-slate-900 text-sm">
                        {employee.employee_name || 'Unknown Employee'}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {employee.employee_number} · {employee.job_title || 'N/A'}
                        {employee.department_name && ` · ${employee.department_name}`}
                      </p>
                      {!employee.is_eligible && (
                        <p className="text-xs text-amber-600 mt-0.5">
                          ⚠️ {employee.ineligibility_reason || 'Ineligible'}
                        </p>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <span className="font-medium text-slate-900 text-sm">
                      KES {employee.gross_pay?.toLocaleString() || '0'}
                    </span>
                  </TableCell>

                  <TableCell className="text-right">
                    <span className="font-medium text-red-600 text-sm">
                      KES {deductionTotal.toLocaleString()}
                    </span>
                  </TableCell>

                  <TableCell className="text-right">
                    <span className="font-semibold text-slate-900 text-sm">
                      KES {employee.net_pay?.toLocaleString() || '0'}
                    </span>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        statusColors[reviewStatus] || 'bg-slate-50 text-slate-700',
                        'border capitalize flex items-center gap-1.5 w-fit rounded-sm text-xs'
                      )}
                    >
                      {statusIcons[reviewStatus]}
                      {reviewStatus.toLowerCase()}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right pr-5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[#7F5EFD] hover:text-[#6b4de0] hover:bg-[#7F5EFD]/10 rounded-sm h-8"
                      onClick={() => setSelectedEmployee(employee)}
                      disabled={isApproved && reviewStatus === 'PENDING'}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                      Review
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
          <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No employees match your filters</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200">
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

      {/* Employee Sheet */}
      {selectedEmployee && (
        <EmployeeSheet
          employee={selectedEmployee}
          isOpen={!!selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
          onUpdateReview={onUpdateReview}
          isUpdating={isUpdating}
          isApproved={isApproved}
        />
      )}
    </>
  );
}