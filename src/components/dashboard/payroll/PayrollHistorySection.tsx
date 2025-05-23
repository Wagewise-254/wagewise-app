// src/components/dashboard/payroll/PayrollHistorySection.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
//import { Input } from '@/components/ui/input'; // For search if needed
//import { toast } from 'sonner';
import { Loader2, Eye } from 'lucide-react'; // Icons

// Import Shadcn UI table components
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';

import axios from 'axios';
import { API_BASE_URL } from '@/config';
import useAuthStore from '@/store/authStore';

import PayrollDetailsDialog from './PayrollDetailsDialog'; // Import the dialog

// Define the type for a Payroll Run summary (re-used from PayrollPage)
interface PayrollRun {
  id: string;
  payroll_number: string;
  payroll_month: string; // e.g., "January 2025"
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
  run_date: string; // ISO string
  finalized_at?: string | null;
  paid_at?: string | null;
}

interface PayrollHistorySectionProps {
  refetchTrigger: number; // Prop to trigger refetch from parent (when new payroll is run)
}

const PayrollHistorySection: React.FC<PayrollHistorySectionProps> = ({ refetchTrigger }) => {
  const { accessToken } = useAuthStore();

  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isPayrollDetailsDialogOpen, setIsPayrollDetailsDialogOpen] = useState(false);
  const [selectedPayrollRunId, setSelectedPayrollRunId] = useState<string | null>(null);


  // --- Fetch Payroll Runs ---
  const fetchPayrollRuns = React.useCallback(async () => {
    if (!accessToken) {
      setError("Authentication token missing.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_BASE_URL}/payroll`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.data && Array.isArray(response.data.payrollRuns)) {
        // Ensure numeric fields are parsed as numbers
        const formattedRuns = response.data.payrollRuns.map((run: PayrollRun) => ({
            ...run,
            total_gross_pay: parseFloat(run.total_gross_pay as unknown as string),
            total_taxable_income: parseFloat(run.total_taxable_income as unknown as string),
            total_paye: parseFloat(run.total_paye as unknown as string),
            total_shif: parseFloat(run.total_shif as unknown as string),
            total_nssf_employee: parseFloat(run.total_nssf_employee as unknown as string),
            total_nssf_employer: parseFloat(run.total_nssf_employer as unknown as string),
            total_helb_deductions: parseFloat(run.total_helb_deductions as unknown as string),
            total_housing_levy_employee: parseFloat(run.total_housing_levy_employee as unknown as string),
            total_housing_levy_employer: parseFloat(run.total_housing_levy_employer as unknown as string),
            total_custom_deductions: parseFloat(run.total_custom_deductions as unknown as string),
            total_custom_benefits: parseFloat(run.total_custom_benefits as unknown as string),
            total_net_pay: parseFloat(run.total_net_pay as unknown as string),
        }));
        setPayrollRuns(formattedRuns);
      } else {
        setPayrollRuns([]);
        console.warn("Unexpected response format for payroll runs fetch:", response.data);
      }

    } catch (err: unknown) {
      console.error("Error fetching payroll runs:", err);
      if (axios.isAxiosError(err) && err.response && typeof err.response.data === 'object') {
        const backendError = err.response.data as { error?: string; message?: string };
        setError(backendError.error || backendError.message || 'Failed to fetch payroll runs.');
      } else {
        setError('An unexpected error occurred while fetching payroll runs.');
      }
      setPayrollRuns([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchPayrollRuns();
  }, [fetchPayrollRuns, refetchTrigger]); // Refetch when token changes or trigger is toggled

  // --- Table Columns Definition ---
  const columns = useMemo<ColumnDef<PayrollRun>[]>(
    () => [
      {
        accessorKey: 'payroll_number',
        header: 'Payroll No',
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: 'payroll_month',
        header: 'Payroll Month',
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: 'run_date',
        header: 'Run Date',
        cell: (info) => new Date(info.getValue() as string).toLocaleDateString(),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: 'total_gross_pay',
        header: 'Gross Pay (KSh)',
        cell: (info) => `KSh ${parseFloat(info.getValue() as string).toFixed(2)}`,
      },
      {
        accessorKey: 'total_paye',
        header: 'PAYE (KSh)',
        cell: (info) => `KSh ${parseFloat(info.getValue() as string).toFixed(2)}`,
      },
      {
        accessorKey: 'total_shif',
        header: 'SHIF (KSh)',
        cell: (info) => `KSh ${parseFloat(info.getValue() as string).toFixed(2)}`,
      },
      {
        accessorKey: 'total_nssf_employee',
        header: 'NSSF (Emp)',
        cell: (info) => `KSh ${parseFloat(info.getValue() as string).toFixed(2)}`,
      },
      {
        accessorKey: 'total_helb_deductions',
        header: 'HELB (KSh)',
        cell: (info) => `KSh ${parseFloat(info.getValue() as string).toFixed(2)}`,
      },
      {
        accessorKey: 'total_housing_levy_employee',
        header: 'Housing Levy (KSh)',
        cell: (info) => `KSh ${parseFloat(info.getValue() as string).toFixed(2)}`,
      },
      {
        accessorKey: 'total_net_pay',
        header: 'Net Pay (KSh)',
        cell: (info) => `KSh ${parseFloat(info.getValue() as string).toFixed(2)}`,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const payrollRun = row.original;
          return (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedPayrollRunId(payrollRun.id);
                setIsPayrollDetailsDialogOpen(true);
              }}
              disabled={loading}
            >
              <Eye className="h-4 w-4 mr-2" /> View Details
            </Button>
          );
        },
      },
    ],
    [loading]
  );

  // --- TanStack Table Instance ---
  const table = useReactTable({
    data: payrollRuns,
    columns,
    getCoreRowModel: getCoreRowModel(),
    // Add pagination, sorting, filtering if needed
  });

  // --- Handle Payroll Details Dialog Close ---
  const handleClosePayrollDetailsDialog = () => {
    setIsPayrollDetailsDialogOpen(false);
    setSelectedPayrollRunId(null);
  };


  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Payroll History</h2>
      <p className="text-gray-600 mb-6">View past payroll runs and their summaries.</p>

      {/* Payroll Runs Table */}
      <div className="flex-1 rounded-md border overflow-auto">
        {loading && (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
            <span className="ml-2 text-gray-600">Loading Payroll Runs...</span>
          </div>
        )}

        {!loading && error && (
          <div className="text-center text-red-500 py-8">
            {error}
            <Button variant="outline" className="ml-4" onClick={fetchPayrollRuns}>Retry</Button>
          </div>
        )}

        {!loading && !error && payrollRuns.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No payroll runs found. Run a new payroll to see history here.
          </div>
        )}

        {!loading && !error && payrollRuns.length > 0 && (
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
        )}
      </div>

      {/* Payroll Details Dialog */}
      {selectedPayrollRunId && ( // Only render if a payroll run is selected
        <PayrollDetailsDialog
          isOpen={isPayrollDetailsDialogOpen}
          onClose={handleClosePayrollDetailsDialog}
          payrollRunId={selectedPayrollRunId}
        />
      )}
    </div>
  );
};

export default PayrollHistorySection;
