// src/components/dashboard/payroll/PayrollRunDetailsView.tsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { Loader2, DownloadCloud, Search, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Info } from 'lucide-react';
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
  taxable_income: number;
  paye_calculated: number;
  paye_after_relief: number;
  personal_relief_amount?: number; // Added for payslip
  insurance_relief_amount?: number; // Added for payslip
  shif_contribution: number;
  nssf_employee_contribution: number;
  nssf_employer_contribution: number;
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


interface PayrollRunDetailsViewProps {
  payrollRunId: string | null; // The ID of the payroll run to display
}

const PayrollRunDetailsView: React.FC<PayrollRunDetailsViewProps> = ({ payrollRunId }) => {
  const { accessToken } = useAuthStore();
  const [payrollRunSummary, setPayrollRunSummary] = useState<PayrollRunSummary | null>(null);
  const [payrollDetails, setPayrollDetails] = useState<PayrollRunDetail[]>([]);
  const [loading, setLoading] = useState(false); // Initially false, true when fetching
  const [error, setError] = useState<string | null>(null);
  const [downloadingPayslipId, setDownloadingPayslipId] = useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const fetchPayrollRunFullDetails = useCallback(async () => {
    if (!payrollRunId || !accessToken) {
      setPayrollRunSummary(null);
      setPayrollDetails([]);
      setLoading(false);
      return;
    }
    setLoading(true); 
    setError(null);
    try {
      const response = await axios.get<{payrollRun: PayrollRunSummary, payrollDetails: PayrollRunDetail[]}>(
        `${API_BASE_URL}/payroll/${payrollRunId}`,
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
            gross_pay: parseFloat(d.gross_pay as unknown as string),
            taxable_income: parseFloat(d.taxable_income as unknown as string),
            paye_calculated: parseFloat(d.paye_calculated as unknown as string),
            paye_after_relief: parseFloat(d.paye_after_relief as unknown as string),
            personal_relief_amount: parseFloat(d.personal_relief_amount as unknown as string || '0'),
            insurance_relief_amount: parseFloat(d.insurance_relief_amount as unknown as string || '0'),
            shif_contribution: parseFloat(d.shif_contribution as unknown as string),
            nssf_employee_contribution: parseFloat(d.nssf_employee_contribution as unknown as string),
            nssf_employer_contribution: parseFloat(d.nssf_employer_contribution as unknown as string),
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
    } finally { setLoading(false); }
  }, [payrollRunId, accessToken]);

  useEffect(() => {
    setGlobalFilter('');
    setPagination({ pageIndex: 0, pageSize: 10 });
    setSorting([]);
    if (payrollRunId) {
        fetchPayrollRunFullDetails();
    } else {
        // Clear data if no payrollRunId is provided
        setPayrollRunSummary(null);
        setPayrollDetails([]);
        setLoading(false);
    }
  }, [payrollRunId, fetchPayrollRunFullDetails]);

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

  if (!payrollRunId && !loading) {
    return (
      <div className="p-6 md:p-8 text-center text-gray-500">
        <Info className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold mb-2">Select a Payroll Run</h3>
        <p>Please select a payroll run from the 'Payroll History' tab to view its details.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-b-lg shadow-sm"> {/* Fits within PayrollPage's content area */}
        {loading && ( <div className="flex flex-1 justify-center items-center"><Loader2 className="animate-spin h-10 w-10 text-[#7F5EFD]" /><span className="ml-3 text-gray-600">Loading...</span></div> )}
        {!loading && error && ( <div className="flex-1 text-center text-red-600 p-10 bg-red-50"><p className="font-semibold">Error!</p><p>{error}</p><Button variant="outline" className="mt-4" onClick={fetchPayrollRunFullDetails}>Retry</Button></div> )}

        {!loading && !error && payrollRunSummary && (
          <>
            {/* Summary Section - Card like appearance */}
            <div className="p-4 md:p-5 border-b border-gray-200 bg-slate-50">
              <h3 className="text-lg md:text-xl font-semibold mb-3 text-gray-700">
                Details for: {payrollRunSummary.payroll_month} ({payrollRunSummary.payroll_number})
              </h3>
              <dl className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-2 text-xs md:text-sm">
                {/* ... (summary dl list as before) ... */}
                <div className="flex flex-col"><dt className="font-medium text-gray-500">Run Date:</dt><dd className="text-gray-800">{new Date(payrollRunSummary.run_date).toLocaleDateString()}</dd></div>
                <div className="flex flex-col"><dt className="font-medium text-gray-500">Status:</dt>
                    <dd><span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusBadgeClass(payrollRunSummary.status)}`}>
                        {payrollRunSummary.status.replace(/_/g, ' ')}</span>
                    </dd>
                </div>
                {payrollRunSummary.run_progress_details?.stage && ( <div className="flex flex-col"><dt className="font-medium text-gray-500">Stage:</dt><dd className="text-gray-800">{payrollRunSummary.run_progress_details.stage.replace(/_/g, ' ')}</dd></div> )}
                <div className="flex flex-col"><dt className="font-medium text-gray-500">Total Gross:</dt><dd className="text-gray-800 font-semibold">{formatToKsh(payrollRunSummary.total_gross_pay)}</dd></div>
                <div className="flex flex-col"><dt className="font-medium text-gray-500">Total Net Pay:</dt><dd className="text-gray-800 font-bold text-[#7F5EFD]">{formatToKsh(payrollRunSummary.total_net_pay)}</dd></div>
              </dl>
            </div>

            {/* Table Controls: Search */}
            <div className="px-4 md:px-5 py-3 flex items-center bg-slate-50 border-b border-gray-200">
              <div className="relative w-full sm:max-w-xs">
                <Input
                  placeholder="Search employees (name, emp no)..."
                  value={globalFilter ?? ''}
                  onChange={(event) => setGlobalFilter(event.target.value)}
                  className="pl-10 h-9 text-sm border-gray-300 focus:border-[#7F5EFD] focus:ring-[#7F5EFD]"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <ScrollArea className="flex-1 data-[orientation=horizontal]:pb-2.5">
                {payrollDetails.length === 0 && !loading && ( <div className="text-center text-gray-500 py-10 px-4">No employee details found.</div> )}
                {payrollDetails.length > 0 && (
                    <div className="px-4 md:px-5 pt-1"> {/* Padding for table content */}
                        <Table className="min-w-[1000px]"> {/* Adjust min-width as needed */}
                            <TableHeader className="bg-gray-100 sticky top-0 z-[5]">
                                {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} onClick={header.column.getToggleSortingHandler()} className="px-3 py-2.5 text-xs font-semibold text-gray-600 whitespace-nowrap cursor-pointer hover:bg-gray-200" style={{ width: header.getSize() }}>
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                        {{ asc: ' ▲', desc: ' ▼' }[header.column.getIsSorted() as string] ?? null}
                                    </TableHead>
                                    ))}
                                </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody className="divide-y divide-gray-200">
                                {table.getRowModel().rows.map((row) => (
                                    <TableRow key={row.id} data-state={row.getIsSelected() && "selected"} className="hover:bg-gray-50/50 transition-colors text-xs">
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="px-3 py-2 whitespace-nowrap">
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
                <div className="px-4 md:px-5 py-2.5 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-600">
                    {/* ... (Pagination controls as before) ... */}
                    <div className="flex-1 text-muted-foreground mb-2 sm:mb-0">
                        Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()} ({table.getFilteredRowModel().rows.length} row(s))
                    </div>
                    <div className="flex items-center space-x-1 sm:space-x-2">
                         <Select value={`${table.getState().pagination.pageSize}`} onValueChange={(value) => { table.setPageSize(Number(value)); }}>
                            <SelectTrigger className="h-7 w-[75px] text-xs px-2"> <SelectValue placeholder={table.getState().pagination.pageSize} /> </SelectTrigger>
                            <SelectContent side="top"> {[10, 20, 30, 50, 100].map((pageSize) => ( <SelectItem key={pageSize} value={`${pageSize}`} className="text-xs">Show {pageSize}</SelectItem> ))} </SelectContent>
                        </Select>
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}> <ChevronsLeft className="h-3.5 w-3.5" /> </Button>
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}> <ChevronLeft className="h-3.5 w-3.5" /> </Button>
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}> <ChevronRight className="h-3.5 w-3.5" /> </Button>
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}> <ChevronsRight className="h-3.5 w-3.5" /> </Button>
                    </div>
                </div>
            )}
          </>
        )}
    </div>
  );
};

export default PayrollRunDetailsView;