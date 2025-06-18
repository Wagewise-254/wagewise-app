// src/components/dashboard/payroll/PayrollRunDetailsView.tsx - FINAL VERSION

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { Loader2, DownloadCloud, ListFilter, RefreshCw, MoreHorizontal, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ColumnDef, flexRender, getCoreRowModel, useReactTable, getFilteredRowModel, getPaginationRowModel, PaginationState, SortingState, getSortedRowModel } from '@tanstack/react-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { API_BASE_URL } from '@/config';
import useAuthStore from '@/store/authStore';
import { formatToKsh } from '@/lib/formatters';

// --- INTERFACES ---

interface PayrollRunSummary {
  id: string;
  payroll_number: string;
  payroll_month: string;
  status: string;
  total_gross_pay: number;
  total_taxable_income: number;
  total_paye: number;
  total_shif: number;
  total_nssf_employee: number;
  total_nssf_employer: number;
  total_helb_deductions: number;
  total_housing_levy_employee: number;
  total_housing_levy_employer: number;
  total_deductions: number;
  total_custom_deductions: number;
  total_custom_benefits: number;
  total_net_pay: number;
  run_date: string;
}

interface PayrollRunDetail {
  id: string;
  net_pay: number;
  cash_gross_pay: number;
  paye_after_relief: number;
  shif_contribution: number;
  nssf_employee_total: number;
  housing_levy_employee: number;
  helb_deduction: number;
  payslip_email_status?: string;
  employees: {
      employee_number: string;
      first_name: string;
      last_name: string;
  };
}

interface PayrollRunOption {
  id: string;
  payroll_month: string;
  payroll_number: string;
  run_date: string;
  status: string;
}

interface PayrollRunDetailsViewProps {
  payrollRunId: string | null;
}


// --- COMPONENT ---

const PayrollRunDetailsView: React.FC<PayrollRunDetailsViewProps> = ({ payrollRunId: initialPayrollRunId }) => {
  const { accessToken } = useAuthStore();
  const [currentSelectedRunId, setCurrentSelectedRunId] = useState<string | null>(initialPayrollRunId);
  const [availableRuns, setAvailableRuns] = useState<PayrollRunOption[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(true);

  const [payrollRunSummary, setPayrollRunSummary] = useState<PayrollRunSummary | null>(null);
  const [payrollDetails, setPayrollDetails] = useState<PayrollRunDetail[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State to track loading status for individual row actions
  const [actionState, setActionState] = useState<{ type: 'download' | 'email' | null, detailId: string | null }>({ type: null, detailId: null });

  // Tanstack Table State
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

  // Fetches the list of completed runs for the dropdown selector
  const fetchAvailablePayrollRuns = useCallback(async () => {
    if (!accessToken) return;
    setLoadingRuns(true);
    try {
      const response = await axios.get<{ payrollRuns: PayrollRunOption[] }>(`${API_BASE_URL}/payroll`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const completedRuns = (response.data.payrollRuns || []).sort((a, b) => new Date(b.run_date).getTime() - new Date(a.run_date).getTime());
      
      setAvailableRuns(completedRuns);
      if (initialPayrollRunId) {
        setCurrentSelectedRunId(initialPayrollRunId);
      } else if (completedRuns.length > 0) {
        setCurrentSelectedRunId(completedRuns[0].id);
      }
    } catch (err) {
      toast.error("Failed to fetch payroll run list.");
    } finally {
      setLoadingRuns(false);
    }
  }, [accessToken, initialPayrollRunId]);

  useEffect(() => {
    fetchAvailablePayrollRuns();
  }, [fetchAvailablePayrollRuns]);
 
  // Fetches the full summary and all employee details for the selected run
  const fetchPayrollRunFullDetails = useCallback(async (runIdToFetch: string | null) => {
    if (!runIdToFetch || !accessToken) {
      setPayrollRunSummary(null); setPayrollDetails([]); return;
    }
    setLoadingDetails(true); setError(null);
    try {
      const response = await axios.get<{payrollRun: PayrollRunSummary, payrollDetails: PayrollRunDetail[]}>(
        `${API_BASE_URL}/payroll/${runIdToFetch}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (response.data) {
        setPayrollRunSummary(response.data.payrollRun);
        setPayrollDetails(response.data.payrollDetails);
      }
    } catch (err) { 
       setError('Failed to fetch payroll details.');
       setPayrollRunSummary(null);
       setPayrollDetails([]);
    } finally { setLoadingDetails(false); }
  }, [accessToken]);

  // Effect to fetch details when the selected run changes
  useEffect(() => {
    setGlobalFilter('');
    setPagination({ pageIndex: 0, pageSize: 10 });
    setSorting([]);
    if (currentSelectedRunId) {
        fetchPayrollRunFullDetails(currentSelectedRunId);
    } else {
        setPayrollRunSummary(null); setPayrollDetails([]); setLoadingDetails(false);
    }
  }, [currentSelectedRunId, fetchPayrollRunFullDetails]);

// Unified action handler for downloading or emailing a single payslip
const handleAction = useCallback(async (type: 'download' | 'email', detail: PayrollRunDetail) => {
  if (!accessToken) { toast.error("Authentication required."); return; }
  
  setActionState({ type, detailId: detail.id });
  const endpoint = type === 'download' ? 'download-single-payslip' : 'send-single-payslip';
  const employeeName = `${detail.employees.first_name} ${detail.employees.last_name}`;
  const successMessage = type === 'download' ? `Payslip for ${employeeName} downloaded.` : `Payslip for ${employeeName} sent to email queue.`;
  const errorMessage = type === 'download' ? 'Failed to download payslip.' : 'Failed to email payslip.';

  try {
      const response = await axios.post(`${API_BASE_URL}/payroll/${endpoint}`, { payrollRunDetailId: detail.id }, {
          headers: { Authorization: `Bearer ${accessToken}` },
          responseType: type === 'download' ? 'blob' : 'json'
      });

      if (type === 'download') {
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement('a');
          link.href = url;
          const contentDisposition = response.headers['content-disposition'];
          let filename = `Payslip_${employeeName.replace(' ', '_')}.pdf`; // Fallback filename
          if (contentDisposition) {
              const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
              if (filenameMatch && filenameMatch[1]) filename = filenameMatch[1];
          }
          link.setAttribute('download', filename);
          document.body.appendChild(link);
          link.click();
          link.parentNode?.removeChild(link);
          window.URL.revokeObjectURL(url);
      }
      toast.success(successMessage);
  } catch (err) {
      toast.error(errorMessage);
      console.error(errorMessage, err);
  } finally {
      setActionState({ type: null, detailId: null });
  }
}, [accessToken]);

  const columns = useMemo<ColumnDef<PayrollRunDetail>[]>(
    () => [
      { accessorFn: row => row.employees.employee_number, header: 'Emp No' },
      { accessorFn: row => `${row.employees.first_name} ${row.employees.last_name}`, header: 'Employee Name', enableSorting: true },
      { accessorKey: 'net_pay', header: 'Net Pay', cell: info => <span className="font-semibold">{formatToKsh(info.getValue() as number)}</span>, enableSorting: true },
      { accessorKey: 'cash_gross_pay', header: 'Gross Pay', cell: info => formatToKsh(info.getValue() as number) },
      { accessorKey: 'paye_after_relief', header: 'PAYE', cell: info => formatToKsh(info.getValue() as number) },
      { accessorKey: 'shif_contribution', header: 'SHIF', cell: info => formatToKsh(info.getValue() as number) },
      { accessorKey: 'nssf_employee_total', header: 'NSSF', cell: info => formatToKsh(info.getValue() as number) },
      { accessorKey: 'payslip_email_status', header: 'Email Status', cell: ({ row }) => {
            const status = row.original.payslip_email_status;
            if (!status) return <span className="text-gray-400 text-xs">N/A</span>;
            let color = 'text-gray-500';
            if (status === 'sent') color = 'text-green-600';
            else if (status === 'failed') color = 'text-red-600';
            else if (status === 'no_email') color = 'text-orange-600';
            return <span className={`text-xs font-medium ${color}`}>{status.replace(/_/g, ' ')}</span>;
        }
      },
      { id: 'actions', header: 'Actions', cell: ({ row }) => { 
          const detail = row.original;
          const isLoading = actionState.detailId === detail.id;
          return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0" disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : <MoreHorizontal className="h-4 w-4" />}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Payslip Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handleAction('download', detail)}>
                        <DownloadCloud className="mr-2 h-4 w-4" />
                        <span>Download</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAction('email', detail)}>
                        <Send className="mr-2 h-4 w-4" />
                        <span>Email to Employee</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      }
    ],
    [actionState, handleAction]
  );

  const table = useReactTable({
    data: payrollDetails,
    columns,
    state: { globalFilter, pagination, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
   <Card className="flex flex-col rounded-b-lg border-t-0">
      <CardHeader className="border-b p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <CardTitle className="text-xl font-semibold text-gray-700">Payroll Run Details</CardTitle>
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <Select value={currentSelectedRunId || ""} onValueChange={setCurrentSelectedRunId} disabled={loadingRuns || loadingDetails}>
                    <SelectTrigger className="w-full sm:w-[280px] h-9 text-sm">
                        <SelectValue placeholder={loadingRuns ? "Loading runs..." : "Select a Payroll Run"} />
                    </SelectTrigger>
                    <SelectContent>
                        {availableRuns.map(run => (
                            <SelectItem key={run.id} value={run.id}>{run.payroll_month} ({run.payroll_number})</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={() => fetchPayrollRunFullDetails(currentSelectedRunId)} disabled={loadingDetails || !currentSelectedRunId} className="h-9 w-9">
                    <RefreshCw className={`h-4 w-4 ${loadingDetails ? 'animate-spin':''}`} />
                </Button>
            </div>
        </div>
      </CardHeader>

      {loadingDetails && ( <div className="flex flex-1 justify-center items-center p-10"><Loader2 className="animate-spin h-8 w-8 text-[#7F5EFD]" /><span className="ml-3">Loading details...</span></div> )}
      {!loadingDetails && error && ( <div className="flex-1 text-center text-red-600 p-10"><p>{error}</p></div> )}
      
      {!currentSelectedRunId && !loadingRuns && !loadingDetails && (
         <div className="flex-1 flex flex-col justify-center items-center text-center text-gray-500 p-10">
            <ListFilter className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Payroll Run Selected</h3>
            <p>Please select a payroll run from the dropdown above to view its details.</p>
        </div>
      )}

      {!loadingDetails && !error && payrollRunSummary && (
        <CardContent className="p-0 flex-1 flex flex-col">
          {/* Summary Section */}
          <div className="p-4 border-b">
            <dl className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-2 text-sm">
                <div className="flex flex-col"><dt className="font-medium text-gray-500">Total Gross Pay</dt><dd className="font-semibold">{formatToKsh(payrollRunSummary.total_gross_pay)}</dd></div>
                <div className="flex flex-col"><dt className="font-medium text-gray-500">Total PAYE</dt><dd>{formatToKsh(payrollRunSummary.total_paye)}</dd></div>
                <div className="flex flex-col"><dt className="font-medium text-gray-500">Total Deductions</dt><dd>{formatToKsh(payrollRunSummary.total_deductions)}</dd></div>
                <div className="flex flex-col"><dt className="font-medium text-gray-500 text-green-600">Total Net Pay</dt><dd className="font-bold text-lg text-green-600">{formatToKsh(payrollRunSummary.total_net_pay)}</dd></div>
            </dl>
          </div>

          <div className="px-4 py-3 flex items-center border-b">
              <Input placeholder="Search employees..." value={globalFilter} onChange={e => setGlobalFilter(e.target.value)} className="h-9 max-w-xs" />
          </div>

          <ScrollArea className="flex-1">
            <Table>
                <TableHeader className="bg-gray-50">
                    {table.getHeaderGroups().map(hg => (<TableRow key={hg.id}>{hg.headers.map(h => (<TableHead key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</TableHead>))}</TableRow>))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows.length ? table.getRowModel().rows.map(row => (
                        <TableRow key={row.id}>{row.getVisibleCells().map(cell => (<TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>))}</TableRow>
                    )) : (<TableRow><TableCell colSpan={columns.length} className="h-24 text-center">No results.</TableCell></TableRow>)}
                </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
          
          <div className="px-4 py-3 border-t flex items-center justify-between text-sm">
            <div className="text-muted-foreground">Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}</div>
            <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Previous</Button>
                <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default PayrollRunDetailsView;