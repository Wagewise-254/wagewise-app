// src/components/dashboard/payroll/PayrollDetailsDialog.tsx

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
//import { toast } from 'sonner';
import { Loader2 } from 'lucide-react'; // Icon for loading

// Import Shadcn UI components
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';

import { API_BASE_URL } from '@/config';
import useAuthStore from '@/store/authStore';

// Define interfaces for the data fetched from the backend
interface PayrollRunSummary {
  id: string;
  payroll_number: string;
  payroll_month: string;
  status: 'Draft' | 'Finalized' | 'Paid';
  total_gross_pay: number;
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
}

interface PayrollRunDetail {
  id: string;
  payroll_run_id: string;
  employee_id: string;
  company_id: string;
  basic_salary: number;
  gross_pay: number;
  taxable_income: number;
  paye_calculated: number;
  paye_after_relief: number;
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
  custom_deductions_applied?: { type: string; amount: number }[] | null; // JSONB parsed
  custom_benefits_applied?: { type: string; amount: number; is_taxable?: boolean }[] | null; // JSONB parsed
  created_at: string;
  // Nested employee details from the join
  employees: {
      id: string;
      employee_number: string;
      first_name: string;
      last_name: string;
      id_number: string;
      kra_pin: string;
  };
}

interface PayrollDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  payrollRunId: string | null; // The ID of the payroll run to display
}

const PayrollDetailsDialog: React.FC<PayrollDetailsDialogProps> = ({ isOpen, onClose, payrollRunId }) => {
  const { accessToken } = useAuthStore();

  const [payrollRunSummary, setPayrollRunSummary] = useState<PayrollRunSummary | null>(null);
  const [payrollDetails, setPayrollDetails] = useState<PayrollRunDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Data Fetching ---
  useEffect(() => {
    const fetchPayrollDetails = async () => {
      if (!isOpen || !payrollRunId || !accessToken) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await axios.get(`${API_BASE_URL}/payroll/${payrollRunId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.data) {
          const summary = response.data.payrollRun;
          const details = response.data.payrollDetails;

          // Parse numeric values from strings and JSONB fields
          const formattedSummary: PayrollRunSummary = {
            ...summary,
            total_gross_pay: parseFloat(summary.total_gross_pay),
            total_taxable_income: parseFloat(summary.total_taxable_income),
            total_paye: parseFloat(summary.total_paye),
            total_shif: parseFloat(summary.total_shif),
            total_nssf_employee: parseFloat(summary.total_nssf_employee),
            total_nssf_employer: parseFloat(summary.total_nssf_employer),
            total_helb_deductions: parseFloat(summary.total_helb_deductions),
            total_housing_levy_employee: parseFloat(summary.total_housing_levy_employee),
            total_housing_levy_employer: parseFloat(summary.total_housing_levy_employer),
            total_custom_deductions: parseFloat(summary.total_custom_deductions),
            total_custom_benefits: parseFloat(summary.total_custom_benefits),
            total_net_pay: parseFloat(summary.total_net_pay),
          };
          setPayrollRunSummary(formattedSummary);

          const formattedDetails: PayrollRunDetail[] = details.map((detail: unknown) => {
            const d = detail as PayrollRunDetail & {
              custom_deductions_applied?: string | null;
              custom_benefits_applied?: string | null;
              [key: string]: unknown;
            };
            return {
              ...d,
              basic_salary: parseFloat(d.basic_salary as unknown as string),
              gross_pay: parseFloat(d.gross_pay as unknown as string),
              taxable_income: parseFloat(d.taxable_income as unknown as string),
              paye_calculated: parseFloat(d.paye_calculated as unknown as string),
              paye_after_relief: parseFloat(d.paye_after_relief as unknown as string),
              shif_contribution: parseFloat(d.shif_contribution as unknown as string),
              nssf_employee_contribution: parseFloat(d.nssf_employee_contribution as unknown as string),
              nssf_employer_contribution: parseFloat(d.nssf_employer_contribution as unknown as string),
              helb_deduction: parseFloat(d.helb_deduction as unknown as string),
              housing_levy_employee: parseFloat(d.housing_levy_employee as unknown as string),
              housing_levy_employer: parseFloat(d.housing_levy_employer as unknown as string),
              total_deductions: parseFloat(d.total_deductions as unknown as string),
              total_benefits: parseFloat(d.total_benefits as unknown as string),
              net_pay: parseFloat(d.net_pay as unknown as string),
              // Parse JSONB fields if they are strings
              custom_deductions_applied: d.custom_deductions_applied ? JSON.parse(d.custom_deductions_applied) : null,
              custom_benefits_applied: d.custom_benefits_applied ? JSON.parse(d.custom_benefits_applied) : null,
            };
          });
          setPayrollDetails(formattedDetails);

        } else {
          setPayrollRunSummary(null);
          setPayrollDetails([]);
          console.warn("Unexpected response format for payroll details fetch:", response.data);
        }

      } catch (err: unknown) {
        console.error("Error fetching payroll details:", err);
        if (axios.isAxiosError(err) && err.response && typeof err.response.data === 'object') {
          const backendError = err.response.data as { error?: string; message?: string };
          setError(backendError.error || backendError.message || 'Failed to fetch payroll details.');
        } else {
          setError('An unexpected error occurred while fetching payroll details.');
        }
        setPayrollRunSummary(null);
        setPayrollDetails([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPayrollDetails();
  }, [isOpen, payrollRunId, accessToken]); // Re-fetch when dialog opens or payrollRunId changes

  // --- Table Columns for Payroll Details ---
  const columns = useMemo<ColumnDef<PayrollRunDetail>[]>(
    () => [
      {
        accessorFn: (row) => row.employees.employee_number,
        id: 'employee_number',
        header: 'Emp No',
        cell: (info) => info.getValue(),
      },
      {
        accessorFn: (row) => `${row.employees.first_name} ${row.employees.last_name}`,
        id: 'employee_name',
        header: 'Employee Name',
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: 'basic_salary',
        header: 'Basic Salary',
        cell: (info) => `KSh ${parseFloat(info.getValue() as string).toFixed(2)}`,
      },
      {
        accessorKey: 'gross_pay',
        header: 'Gross Pay',
        cell: (info) => `KSh ${parseFloat(info.getValue() as string).toFixed(2)}`,
      },
      {
        accessorKey: 'paye_after_relief',
        header: 'PAYE',
        cell: (info) => `KSh ${parseFloat(info.getValue() as string).toFixed(2)}`,
      },
      {
        accessorKey: 'shif_contribution',
        header: 'SHIF',
        cell: (info) => `KSh ${parseFloat(info.getValue() as string).toFixed(2)}`,
      },
      {
        accessorKey: 'nssf_employee_contribution',
        header: 'NSSF (Emp)',
        cell: (info) => `KSh ${parseFloat(info.getValue() as string).toFixed(2)}`,
      },
      {
        accessorKey: 'helb_deduction',
        header: 'HELB',
        cell: (info) => `KSh ${parseFloat(info.getValue() as string).toFixed(2)}`,
      },
      {
        accessorKey: 'housing_levy_employee',
        header: 'Housing Levy',
        cell: (info) => `KSh ${parseFloat(info.getValue() as string).toFixed(2)}`,
      },
      {
        accessorKey: 'total_deductions',
        header: 'Total Deductions',
        cell: (info) => `KSh ${parseFloat(info.getValue() as string).toFixed(2)}`,
      },
      {
        accessorKey: 'net_pay',
        header: 'Net Pay',
        cell: (info) => `KSh ${parseFloat(info.getValue() as string).toFixed(2)}`,
      },
      {
        id: 'custom_details',
        header: 'Custom Details',
        cell: ({ row }) => {
          const detail = row.original;
          const customBenefits = detail.custom_benefits_applied;
          const customDeductions = detail.custom_deductions_applied;

          return (
            <div className="text-xs">
              {customBenefits && customBenefits.length > 0 && (
                <>
                  <p className="font-semibold">Benefits:</p>
                  {customBenefits.map((b, idx) => (
                    <p key={idx}>{b.type}: KSh {b.amount.toFixed(2)}</p>
                  ))}
                </>
              )}
              {customDeductions && customDeductions.length > 0 && (
                <>
                  <p className="font-semibold mt-1">Deductions:</p>
                  {customDeductions.map((d, idx) => (
                    <p key={idx}>{d.type}: KSh {d.amount.toFixed(2)}</p>
                  ))}
                </>
              )}
              {(!customBenefits || customBenefits.length === 0) && (!customDeductions || customDeductions.length === 0) && (
                <p>-</p>
              )}
            </div>
          );
        },
      },
    ],
    []
  );

  // --- TanStack Table Instance ---
  const table = useReactTable({
    data: payrollDetails,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[90vw] lg:max-w-[1200px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Payroll Details for {payrollRunSummary?.payroll_month}</DialogTitle>
          <DialogDescription>
            Detailed breakdown of the payroll run including individual employee calculations.
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
            <span className="ml-2 text-gray-600">Loading Payroll Details...</span>
          </div>
        )}

        {!loading && error && (
          <div className="text-center text-red-500 py-8">
            {error}
            <Button variant="outline" className="ml-4" onClick={() => { /* re-fetch logic */ }}>Retry</Button>
          </div>
        )}

        {!loading && !error && payrollRunSummary && (
          <div className="mb-4 p-4 border rounded-md bg-gray-50">
            <h3 className="text-lg font-semibold mb-2">Payroll Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
              <p><strong>Payroll No:</strong> {payrollRunSummary.payroll_number}</p>
              <p><strong>Month:</strong> {payrollRunSummary.payroll_month}</p>
              <p><strong>Run Date:</strong> {new Date(payrollRunSummary.run_date).toLocaleDateString()}</p>
              <p><strong>Status:</strong> {payrollRunSummary.status}</p>
              <p><strong>Total Gross Pay:</strong> KSh {payrollRunSummary.total_gross_pay.toFixed(2)}</p>
              <p><strong>Total PAYE:</strong> KSh {payrollRunSummary.total_paye.toFixed(2)}</p>
              <p><strong>Total SHIF:</strong> KSh {payrollRunSummary.total_shif.toFixed(2)}</p>
              <p><strong>Total NSSF (Emp):</strong> KSh {payrollRunSummary.total_nssf_employee.toFixed(2)}</p>
              <p><strong>Total HELB:</strong> KSh {payrollRunSummary.total_helb_deductions.toFixed(2)}</p>
              <p><strong>Total Housing Levy (Emp):</strong> KSh {payrollRunSummary.total_housing_levy_employee.toFixed(2)}</p>
              <p><strong>Total Net Pay:</strong> KSh {payrollRunSummary.total_net_pay.toFixed(2)}</p>
              {/* Add more summary details as needed */}
            </div>
          </div>
        )}

        {!loading && !error && payrollDetails.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No payroll details found for this run.
          </div>
        )}

        {!loading && !error && payrollDetails.length > 0 && (
          <div className="flex-1 overflow-auto rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PayrollDetailsDialog;
