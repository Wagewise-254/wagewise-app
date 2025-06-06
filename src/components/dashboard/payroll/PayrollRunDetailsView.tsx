// src/components/dashboard/payroll/PayrollRunDetailsView.tsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { Loader2, DownloadCloud, Search, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, ListFilter, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ColumnDef, flexRender, getCoreRowModel, useReactTable, getFilteredRowModel, getPaginationRowModel, PaginationState, SortingState, getSortedRowModel,
} from '@tanstack/react-table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { API_BASE_URL } from '@/config';
import useAuthStore from '@/store/authStore';
import { formatToKsh, getStatusBadgeClass } from '@/lib/formatters';

// Interfaces (PayrollRunSummary, PayrollRunDetail) are the same as in previous PayrollDetailsDialog
interface PayrollRunSummary {
  id: string;
  payroll_number: string;
  payroll_month: string;
  status: string;
  total_gross_pay: number;
  // ... (all other fields from your PayrollRunSummary interface)
  total_taxable_income: number;
  total_paye: number;
  total_shif: number;
  total_nssf_employee: number;
  total_nssf_employer: number;
  total_helb_deductions: number;
  total_housing_levy_employee: number;
  total_housing_levy_employer: number;
  total_custom_deductions: number;
  total_custom_benefits: number;
  total_net_pay: number;
  run_date: string;
  finalized_at?: string | null;
  paid_at?: string | null;
  run_progress_details?: {
    stage?: string;
    message?: string;
    failed_emails_count?: number;
  } | null;
}

interface PayrollRunDetail {
  id: string;
  payroll_run_id: string;
  employee_id: string;
  company_id: string;
  basic_salary: number;
  // ... (all other fields from your PayrollRunDetail interface)
  gross_pay: number;
  cash_gross_pay: number; // Assuming this is the same as gross_pay
  taxable_income: number;
  paye_calculated: number;
  paye_after_relief: number;
  personal_relief_amount?: number; // Added for payslip
  insurance_relief_amount?: number; // Added for payslip
  shif_contribution: number;
  nssf_employee_contribution: number;
  nssf_employer_contribution: number;
  nssf_employee_total: number;
  nssf_employer_total: number;
  helb_deduction: number;
  housing_levy_employee: number;
  housing_levy_employer: number;
  total_deductions: number;
  total_benefits: number;
  net_pay: number;
  payment_method: string;
  bank_name?: string | null;
  bank_account_number?: string | null;
  mpesa_phone_number?: string | null;
  custom_deductions_applied?: { type: string; amount: number }[] | null;
  custom_benefits_applied?: { type: string; amount: number; is_taxable?: boolean }[] | null;
  created_at: string;
  payslip_email_status?: string;
  payslip_email_error?: string | null;
  employees: {
      id: string;
      employee_number: string;
      first_name: string;
      last_name: string;
      id_number: string;
      kra_pin: string;
  };
}

interface PayrollRunOption { // For the dropdown
  id: string;
  payroll_month: string;
  payroll_number: string;
  run_date: string;
  status: string;
}


interface PayrollRunDetailsViewProps {
  payrollRunId: string | null; // The ID of the payroll run to display
}

const PayrollRunDetailsView: React.FC<PayrollRunDetailsViewProps> = ({ payrollRunId: initialPayrollRunId }) => {
   const { accessToken } = useAuthStore();
  const [currentSelectedRunId, setCurrentSelectedRunId] = useState<string | null>(initialPayrollRunId);
  const [availableRuns, setAvailableRuns] = useState<PayrollRunOption[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(true);

  const [payrollRunSummary, setPayrollRunSummary] = useState<PayrollRunSummary | null>(null);
  const [payrollDetails, setPayrollDetails] = useState<PayrollRunDetail[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadingPayslipId, setDownloadingPayslipId] = useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const fetchAvailablePayrollRuns = useCallback(async () => {
    if (!accessToken) return;
    setLoadingRuns(true);
    try {
      const response = await axios.get<{ payrollRuns: PayrollRunOption[] }>(`${API_BASE_URL}/payroll`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const completedRuns = (response.data.payrollRuns || []).filter(run =>
        ['Payslips_Sent', 'Calculation_Complete', 'Paid', 'Finalized'].includes(run.status)
      ).sort((a, b) => new Date(b.run_date).getTime() - new Date(a.run_date).getTime()); // Sort by date desc
      
      setAvailableRuns(completedRuns);
      if (!initialPayrollRunId && completedRuns.length > 0) {
        setCurrentSelectedRunId(completedRuns[0].id); // Default to latest completed if no initial ID
      } else if (initialPayrollRunId) {
        setCurrentSelectedRunId(initialPayrollRunId);
      }
    } catch (err) {
      toast.error("Failed to fetch payroll run list for selection.");
      console.error("Error fetching available payroll runs:", err);
    } finally {
      setLoadingRuns(false);
    }
  }, [accessToken, initialPayrollRunId]);

  useEffect(() => {
    fetchAvailablePayrollRuns();
  }, [fetchAvailablePayrollRuns]);
 


  const fetchPayrollRunFullDetails = useCallback(async (runIdToFetch: string | null) => {
    if (!runIdToFetch || !accessToken) {
      setPayrollRunSummary(null); setPayrollDetails([]); setLoadingDetails(false); return;
    }
    setLoadingDetails(true); setError(null);

    try {
      const response = await axios.get<{payrollRun: PayrollRunSummary, payrollDetails: PayrollRunDetail[]}>(
        `${API_BASE_URL}/payroll/${runIdToFetch}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (response.data) {
        const summary = response.data.payrollRun;
        const details = response.data.payrollDetails;
        // Ensure all numeric fields are parsed from string to number
        const formattedSummary: PayrollRunSummary = {
          ...summary,
          total_gross_pay: parseFloat(summary.total_gross_pay as unknown as string),
          total_taxable_income: parseFloat(summary.total_taxable_income as unknown as string),
          total_paye: parseFloat(summary.total_paye as unknown as string),
          total_shif: parseFloat(summary.total_shif as unknown as string),
          total_nssf_employee: parseFloat(summary.total_nssf_employee as unknown as string),
          total_nssf_employer: parseFloat(summary.total_nssf_employer as unknown as string),
          total_helb_deductions: parseFloat(summary.total_helb_deductions as unknown as string),
          total_housing_levy_employee: parseFloat(summary.total_housing_levy_employee as unknown as string),
          total_housing_levy_employer: parseFloat(summary.total_housing_levy_employer as unknown as string),
          total_custom_deductions: parseFloat(summary.total_custom_deductions as unknown as string),
          total_custom_benefits: parseFloat(summary.total_custom_benefits as unknown as string),
          total_net_pay: parseFloat(summary.total_net_pay as unknown as string),
        };
        setPayrollRunSummary(formattedSummary);

        const formattedDetails: PayrollRunDetail[] = details.map((d) => ({
            ...d,
            basic_salary: parseFloat(d.basic_salary as unknown as string),
            gross_pay: parseFloat(d.cash_gross_pay as unknown as string),
            taxable_income: parseFloat(d.taxable_income as unknown as string),
            paye_calculated: parseFloat(d.paye_calculated as unknown as string),
            paye_after_relief: parseFloat(d.paye_after_relief as unknown as string),
            personal_relief_amount: parseFloat(d.personal_relief_amount as unknown as string || '0'),
            insurance_relief_amount: parseFloat(d.insurance_relief_amount as unknown as string || '0'),
            shif_contribution: parseFloat(d.shif_contribution as unknown as string),
            nssf_employee_contribution: parseFloat(d.nssf_employee_total as unknown as string),
            nssf_employer_contribution: parseFloat(d.nssf_employer_total as unknown as string),
            helb_deduction: parseFloat(d.helb_deduction as unknown as string),
            housing_levy_employee: parseFloat(d.housing_levy_employee as unknown as string),
            housing_levy_employer: parseFloat(d.housing_levy_employer as unknown as string),
            total_deductions: parseFloat(d.total_deductions as unknown as string),
            total_benefits: parseFloat(d.total_benefits as unknown as string),
            net_pay: parseFloat(d.net_pay as unknown as string),
            custom_deductions_applied: typeof d.custom_deductions_applied === 'string' ? JSON.parse(d.custom_deductions_applied) : d.custom_deductions_applied,
            custom_benefits_applied: typeof d.custom_benefits_applied === 'string' ? JSON.parse(d.custom_benefits_applied) : d.custom_benefits_applied,
        }));
        setPayrollDetails(formattedDetails);
      }
    } catch (err) { 
       console.error("Error fetching payroll details for view:", err);
        if (axios.isAxiosError(err) && err.response?.data && typeof err.response.data === 'object') {
          const backendError = err.response.data as { error?: string; message?: string };
          setError(backendError.error || backendError.message || 'Failed to fetch payroll details.');
        } else {
          setError('An unexpected error occurred while fetching payroll details.');
        }
        setPayrollRunSummary(null);
        setPayrollDetails([]);
    } finally { setLoadingDetails(false); }
  }, [ accessToken]);

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

  // handleDownloadIndividualPayslip and columns definitions remain the same as your last enhanced version
  // ... (ensure handleDownloadIndividualPayslip and columns are correctly defined here, as in PayrollDetailsDialog previous version)
  const handleDownloadIndividualPayslip = useCallback(
    async (runDetail: PayrollRunDetail) => {
      if (!accessToken) { toast.error("Authentication required."); return; }
      const employeeName = `${runDetail.employees.first_name} ${runDetail.employees.last_name}`;
      setDownloadingPayslipId(runDetail.id);
      try {
        const response = await axios.post(
          `${API_BASE_URL}/payroll/generate-employee-payslip`, 
          { payrollRunDetailId: runDetail.id },
          { headers: { Authorization: `Bearer ${accessToken}` }, responseType: 'blob' }
        );
        
        const safeEmployeeName = (employeeName || "Employee").replace(/[^a-zA-Z0-9_-\s]/g, '').replace(/\s+/g, '_');
        // Extract month and year from payrollRunSummary.payroll_month (e.g., "October 2024")
        const monthYearParts = payrollRunSummary?.payroll_month.split(' ');
        const monthForFile = monthYearParts && monthYearParts.length > 0 ? monthYearParts[0] : "Month";
        const yearForFile = monthYearParts && monthYearParts.length > 1 ? monthYearParts[1] : "Year";

        let filename = `Payslip_${safeEmployeeName}_${monthForFile}_${yearForFile}.pdf`;

        const contentDisposition = response.headers['content-disposition'];
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename\*?=['"]?(?:UTF-\d['"]*)?([^;\r\n"']+)['"]?;?/i);
          if (filenameMatch && filenameMatch[1]) {
            try { filename = decodeURIComponent(filenameMatch[1]); } 
            catch (e) { filename = filenameMatch[1]; }
            if (!filename.toLowerCase().endsWith('.pdf') && response.headers['content-type'] === 'application/pdf') filename += '.pdf';
          }
        }
        if (!filename.toLowerCase().endsWith('.pdf')) filename = `Payslip_${safeEmployeeName}_${monthForFile}_${yearForFile}.pdf`;

        const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link); link.click(); link.parentNode?.removeChild(link); window.URL.revokeObjectURL(url);
        toast.success(`Payslip for ${employeeName} downloaded as ${filename}.`);
      } catch (err) { /* ... error handling ... */ 
         console.error("Error downloading individual payslip:", err);
        const errorMsg = 'Failed to download payslip.';
        if (axios.isAxiosError(err) && err.response) { /* ... error parsing logic ... */ }
        toast.error(errorMsg);
      } finally { setDownloadingPayslipId(null); }
    },
    [accessToken, payrollRunSummary?.payroll_month]
  );

  const columns = useMemo<ColumnDef<PayrollRunDetail>[]>(
    () => [
      { accessorFn: (row) => row.employees.employee_number, id: 'employee_number', header: 'Emp No', size: 70, enableSorting: true },
      { accessorFn: (row) => `${row.employees.first_name} ${row.employees.last_name}`, id: 'employee_name', header: 'Employee Name', size: 160, enableSorting: true },
      { accessorKey: 'net_pay', header: 'Net Pay', cell: (info) => <span className="font-semibold">{formatToKsh(info.getValue() as number)}</span>, size: 100, enableSorting: true },
      { accessorKey: 'gross_pay', header: 'Gross Pay', cell: (info) => formatToKsh(info.getValue() as number), size: 100 },
      { accessorKey: 'paye_after_relief', header: 'PAYE', cell: (info) => formatToKsh(info.getValue() as number), size: 90 },
      { accessorKey: 'shif_contribution', header: 'SHIF', cell: (info) => formatToKsh(info.getValue() as number), size: 90 },
      { accessorKey: 'nssf_employee_contribution', header: 'NSSF', cell: (info) => formatToKsh(info.getValue() as number), size: 90 },
      { accessorKey: 'housing_levy_employee', header: 'Housing Levy', cell: (info) => formatToKsh(info.getValue() as number), size: 100 },
      { accessorKey: 'helb_deduction', header: 'HELB', cell: (info) => formatToKsh(info.getValue() as number), size: 90 },
      {
        accessorKey: 'payslip_email_status', header: 'Email Status', size: 90,
        cell: ({ row }) => { /* ... email status cell ... */ 
            const status = row.original.payslip_email_status;
            if (!status) return <span className="text-gray-400 text-xs">N/A</span>;
            let color = 'text-gray-500';
            if (status === 'sent') color = 'text-green-600';
            else if (status === 'failed') color = 'text-red-600';
            else if (status === 'no_email') color = 'text-orange-600';
            return <span className={`text-xs font-medium ${color}`}>{status.replace(/_/g, ' ').toUpperCase()}</span>;
        }
      },
      {
        id: 'actions', header: 'Payslip PDF', size: 90,
        cell: ({ row }) => { 
          const detail = row.original;
          const isLoading = downloadingPayslipId === detail.id;
          return (
            <Button
              variant="ghost" size="icon"
              onClick={() => handleDownloadIndividualPayslip(detail)}
              disabled={isLoading}
              className="h-7 w-7 text-[#7F5EFD] hover:bg-purple-100 hover:text-[#5d3fbc]"
              title={`Download payslip`}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <DownloadCloud className="h-4 w-4" />}
            </Button>
          );
        },
      }
    ],
    [downloadingPayslipId, handleDownloadIndividualPayslip]
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

  if (loadingRuns && !currentSelectedRunId) { // Show loader only if fetching initial run list and no run selected
    return <div className="flex flex-1 justify-center items-center p-10"><Loader2 className="animate-spin h-8 w-8 text-[#7F5EFD]" /> <span className="ml-3">Loading payroll runs...</span></div>;
  }

  return (
   <Card className=" flex flex-col shadow-md rounded-b-lg border-t-0"> {/* Removed rounded-b-lg if PayrollPage already has it */}
      <CardHeader className="border-b  p-4 rounded-t-lg"> {/* Added some padding */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <CardTitle className="text-lg md:text-xl font-semibold text-gray-700">
                Payroll Run Details
            </CardTitle>
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <Select
                    value={currentSelectedRunId || ""}
                    onValueChange={(value) => setCurrentSelectedRunId(value)}
                    disabled={loadingRuns || loadingDetails}
                >
                    <SelectTrigger className="w-full sm:w-[280px] h-9 text-sm focus:border-[#7F5EFD] focus:ring-[#7F5EFD]">
                        <SelectValue placeholder={loadingRuns ? "Loading runs..." : "Select a Payroll Run"} />
                    </SelectTrigger>
                    <SelectContent>
                        {availableRuns.length === 0 && !loadingRuns && <SelectItem value="no-runs" disabled>No completed runs found</SelectItem>}
                        {availableRuns.map(run => (
                            <SelectItem key={run.id} value={run.id} className="text-sm">
                                {run.payroll_month} ({run.payroll_number})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={() => fetchPayrollRunFullDetails(currentSelectedRunId)} disabled={loadingDetails || !currentSelectedRunId} className="h-9 w-9">
                    <RefreshCw className={`h-4 w-4 ${loadingDetails ? 'animate-spin':''}`} />
                </Button>
            </div>
        </div>
        {currentSelectedRunId && !loadingDetails && !payrollRunSummary && !error && (
             <p className="text-sm text-gray-500 mt-2">Select a run to view details.</p>
        )}
      </CardHeader>

      {loadingDetails && ( <div className="flex flex-1 justify-center items-center p-10"><Loader2 className="animate-spin h-8 w-8 text-[#7F5EFD]" /><span className="ml-3">Loading details...</span></div> )}
      {!loadingDetails && error && ( <div className="flex-1 text-center text-red-600 p-10 bg-red-50"><p className="font-semibold">Error!</p><p>{error}</p><Button variant="outline" className="mt-4" onClick={() => fetchPayrollRunFullDetails(currentSelectedRunId)}>Retry</Button></div> )}
      
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
          <div className="p-4 md:p-5 border-b">
            <h4 className="text-base font-medium mb-2.5 text-gray-600">
              Summary for: {payrollRunSummary.payroll_month} <span className="text-xs text-gray-500">({payrollRunSummary.payroll_number})</span>
            </h4>
            <dl className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-1.5 text-xs">
                {/* ... (summary dl list as before but with smaller text) ... */}
                <div className="flex flex-col"><dt className="font-medium text-gray-500">Run Date:</dt><dd className="text-gray-700">{new Date(payrollRunSummary.run_date).toLocaleDateString()}</dd></div>
                <div className="flex flex-col"><dt className="font-medium text-gray-500">Status:</dt>
                    <dd><span className={`px-1.5 py-0.5 text-[11px] font-medium rounded-md border ${getStatusBadgeClass(payrollRunSummary.status)}`}>
                        {payrollRunSummary.status.replace(/_/g, ' ')}</span>
                    </dd>
                </div>
                <div className="flex flex-col"><dt className="font-medium text-gray-500">Total Gross:</dt><dd className="text-gray-700 font-semibold">{formatToKsh(payrollRunSummary.total_gross_pay)}</dd></div>
                <div className="flex flex-col"><dt className="font-medium text-gray-500">Total Net Pay:</dt><dd className="text-gray-700 font-bold text-[#7F5EFD]">{formatToKsh(payrollRunSummary.total_net_pay)}</dd></div>
            </dl>
          </div>

          {/* Table Controls: Search */}
          <div className="px-4 md:px-5 py-2.5 flex items-center border-b">
            <div className="relative w-full sm:max-w-xs">
              <Input placeholder="Search employees..." value={globalFilter ?? ''} onChange={(event) => setGlobalFilter(event.target.value)}
                className="pl-9 h-8 text-xs border-gray-300 focus:border-[#7F5EFD] focus:ring-[#7F5EFD]" />
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            </div>
          </div>

          <ScrollArea className="flex-1 data-[orientation=horizontal]:pb-2.5">
            {payrollDetails.length === 0 && !loadingDetails && ( <div className="text-center text-gray-500 py-10 px-4">No employee details found.</div> )}
            {payrollDetails.length > 0 && (
                <div className="px-4 md:px-5 pt-1">
                    <Table className="min-w-[900px]">
                        <TableHeader className="bg-gray-100 sticky top-0 z-[5]">
                          {table.getHeaderGroups().map(headerGroup => (
                            <TableRow key={headerGroup.id}>
                              {headerGroup.headers.map(header => (
                                <TableHead key={header.id} onClick={header.column.getToggleSortingHandler()}
                                  className="px-2.5 py-2 text-[11px] font-bold text-gray-500 whitespace-nowrap cursor-pointer hover:bg-gray-200 tracking-wider"
                                  style={{ width: header.getSize() }}>
                                  {flexRender(header.column.columnDef.header, header.getContext())}
                                  {{ asc: ' ▲', desc: ' ▼' }[header.column.getIsSorted() as string] ?? null}
                                </TableHead>
                              ))}
                            </TableRow>
                          ))}
                        </TableHeader>
                        <TableBody className="divide-y divide-gray-200">
                          {table.getRowModel().rows.map(row => (
                            <TableRow key={row.id} className="hover:bg-slate-50/70 transition-colors text-[11px]">
                              {row.getVisibleCells().map(cell => (
                                <TableCell key={cell.id} className="px-2.5 py-1.5 whitespace-nowrap">
                                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                    </Table>
                </div>
            )}
            <ScrollBar orientation="horizontal" className="mx-4 md:mx-5" />
          </ScrollArea>
          
          {payrollDetails.length > 0 && (
            <div className="px-4 md:px-5 py-2 border-t flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-gray-500">
                {/* ... (Pagination controls with adjusted sizes if needed) ... */}
                <div className="flex-1 text-muted-foreground mb-1 sm:mb-0"> Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()} ({table.getFilteredRowModel().rows.length} row(s)) </div>
                <div className="flex items-center space-x-1">
                    <Select value={`${table.getState().pagination.pageSize}`} onValueChange={(value) => { table.setPageSize(Number(value)); }}>
                        <SelectTrigger className="h-6 w-[70px] text-[11px] px-1.5"> <SelectValue placeholder={table.getState().pagination.pageSize} /> </SelectTrigger>
                        <SelectContent side="top"> {[10, 20, 30, 50, 100].map((pageSize) => ( <SelectItem key={pageSize} value={`${pageSize}`} className="text-[11px]">Show {pageSize}</SelectItem> ))} </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}> <ChevronsLeft className="h-3 w-3" /> </Button>
                    <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}> <ChevronLeft className="h-3 w-3" /> </Button>
                    <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}> <ChevronRight className="h-3 w-3" /> </Button>
                    <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}> <ChevronsRight className="h-3 w-3" /> </Button>
                </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default PayrollRunDetailsView;