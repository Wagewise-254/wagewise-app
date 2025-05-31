// src/components/dashboard/payroll/PayrollHistorySection.tsx

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Eye, RefreshCw, FileText } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
  getPaginationRowModel,
  PaginationState,
} from "@tanstack/react-table"; // Added sorting and pagination
import axios from "axios";
import { API_BASE_URL } from "@/config";
import useAuthStore from "@/store/authStore";
//import PayrollDetailsDialog from './PayrollDetailsDialog';
import { formatKshCompact, getStatusBadgeClass } from "@/lib/formatters"; // Import formatters
import { Input } from "@/components/ui/input"; // For global filter
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // For Page Size
import {
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from "lucide-react"; // Pagination icons
import { getFilteredRowModel as tanstackGetFilteredRowModel } from "@tanstack/react-table";

// Extended PayrollRun interface to match backend response from /payroll endpoint
interface PayrollRun {
  id: string;
  payroll_number: string;
  payroll_month: string;
  status: string; // Backend now sends various string statuses
  total_gross_pay: number | string; // Can be string from backend
  total_taxable_income: number | string;
  total_paye: number | string;
  total_shif: number | string;
  total_nssf_employee: number | string;
  total_nssf_employer: number | string;
  total_helb_deductions: number | string;
  total_housing_levy_employee: number | string;
  total_housing_levy_employer: number | string;
  total_custom_deductions: number | string;
  total_custom_benefits: number | string;
  total_net_pay: number | string;
  run_date: string;
  finalized_at?: string | null;
  paid_at?: string | null;
  created_by: string;
  updated_by: string;
  company_id: string;
  run_progress_details?: object | null; // JSONB, details about the run stages
}

interface PayrollHistorySectionProps {
  refetchTrigger: number;
  onViewDetails: (payrollRunId: string) => void; // Callback to parent to switch tab and set ID
}

const PayrollHistorySection: React.FC<PayrollHistorySectionProps> = ({
  refetchTrigger,
  onViewDetails,
}) => {
  const { accessToken } = useAuthStore();
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // State for TanStack Table features
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  function getFilteredRowModel() {
    return tanstackGetFilteredRowModel();
  }

  const fetchPayrollRuns = useCallback(
    async (showLoader = true) => {
      if (!accessToken) {
        setError("Authentication token missing.");
        if (showLoader) setLoading(false);
        return;
      }
      if (showLoader) setLoading(true);
      setError(null);

      try {
        const response = await axios.get<{ payrollRuns: PayrollRun[] }>(
          `${API_BASE_URL}/payroll`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        if (response.data && Array.isArray(response.data.payrollRuns)) {
          const formattedRuns = response.data.payrollRuns.map((run) => ({
            ...run,
            // Ensure numeric fields are parsed correctly if they might come as strings
            total_gross_pay: parseFloat(run.total_gross_pay as string),
            total_paye: parseFloat(run.total_paye as string),
            total_shif: parseFloat(run.total_shif as string),
            total_nssf_employee: parseFloat(run.total_nssf_employee as string),
            total_helb_deductions: parseFloat(
              run.total_helb_deductions as string
            ),
            total_housing_levy_employee: parseFloat(
              run.total_housing_levy_employee as string
            ),
            total_net_pay: parseFloat(run.total_net_pay as string),
          }));
          setPayrollRuns(formattedRuns);
        } else {
          setPayrollRuns([]);
        }
      } catch (err: unknown) {
        console.error("Error fetching payroll runs:", err);
        console.error("Error fetching payroll runs:", err);
        setPayrollRuns([]);
        if (
          axios.isAxiosError(err) &&
          err.response?.data &&
          typeof err.response.data === "object"
        ) {
          const backendError = err.response.data as {
            error?: string;
            message?: string;
          };
          setError(
            backendError.error ||
              backendError.message ||
              "Failed to fetch payroll runs."
          );
        } else {
          setError("An unexpected error occurred.");
        }
        setPayrollRuns([]);
      } finally {
        if (showLoader) setLoading(false);
      }
    },
    [accessToken]
  );

  useEffect(() => {
    fetchPayrollRuns();
  }, [fetchPayrollRuns, refetchTrigger]);

  const columns = useMemo<ColumnDef<PayrollRun>[]>(
    () => [
      { accessorKey: "payroll_month", header: "Month", enableSorting: true },
      {
        accessorKey: "payroll_number",
        header: "Payroll No.",
        enableSorting: true,
      },
      {
        accessorKey: "run_date",
        header: "Run Date",
        cell: (info) =>
          new Date(info.getValue() as string).toLocaleDateString(),
        enableSorting: true,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: (info) => {
          /* ... status badge ... */
          const status = info.getValue() as string;
          return (
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadgeClass(
                status
              )}`}
            >
              {status.replace(/_/g, " ")}
            </span>
          );
        },
        enableSorting: true,
      },
      {
        accessorKey: "total_net_pay",
        header: "Net Pay",
        cell: (info) => formatKshCompact(info.getValue() as number),
        enableSorting: true,
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewDetails(row.original.id)} // Use the callback
            className="text-[#7F5EFD] hover:text-[#6a4fcf] hover:bg-purple-50"
            disabled={loading}
          >
            {" "}
            <Eye className="h-4 w-4 mr-1" /> View Details{" "}
          </Button>
        ),
      },
    ],
    [loading, onViewDetails]
  );

  const table = useReactTable({
    data: payrollRuns,
    columns,
    state: { globalFilter, sorting, pagination },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="p-0 md:p-0 bg-white min-h-full rounded-b-lg">
      {" "}
      {/* Adjusted padding */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 p-4 border-b bg-slate-50 rounded-t-lg">
        <div>
          <h2 className="text-lg md:text-xl font-semibold text-gray-700">
            Payroll Run History
          </h2>
          <p className="text-xs md:text-sm text-gray-500">
            Review past payroll runs and their outcomes.
          </p>
        </div>
        <div className="flex items-center gap-2 mt-3 sm:mt-0 w-full sm:w-auto">
          <Input
            placeholder="Search history (month, no.)..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="h-9 text-sm w-full sm:w-auto md:min-w-[250px] border-gray-300 focus:border-[#7F5EFD] focus:ring-[#7F5EFD]"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchPayrollRuns(true)}
            disabled={loading}
            className="hover:bg-gray-100 h-9"
          >
            <RefreshCw
              className={`mr-0 sm:mr-2 h-4 w-4 ${
                loading ? "animate-spin" : ""
              }`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>
      {loading && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="animate-spin h-6 w-6 text-gray-400 mr-2" />
          <span className="text-gray-500 text-sm">
            Loading payroll history...
          </span>
        </div>
      )}
      {!loading && error && (
        <div className="flex flex-col items-center py-10 text-center text-red-500">
          <span className="font-semibold">Error:</span>
          <span className="text-sm">{error}</span>
        </div>
      )}
      {!loading && !error && payrollRuns.length === 0 && (
        <div className="flex flex-col items-center py-10 text-center text-gray-500">
          <FileText className="h-8 w-8 mb-2" />
          <span className="text-sm">No payroll runs found.</span>
        </div>
      )}
      {!loading && !error && payrollRuns.length > 0 && (
        <>
          <div className="overflow-x-auto px-4">
            <Table>
              <TableHeader className="bg-gray-50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        onClick={header.column.getToggleSortingHandler()}
                        className="px-3 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-gray-200"
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{ asc: " ▲", desc: " ▼" }[
                          header.column.getIsSorted() as string
                        ] ?? null}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="divide-y divide-gray-200">
                {table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="px-3 py-2.5 text-sm text-gray-700 whitespace-nowrap"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {/* Pagination Controls for History Table */}
          <div className="px-4 py-3 border-t flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-600">
            <div className="flex-1 text-muted-foreground mb-2 sm:mb-0">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()} ({table.getFilteredRowModel().rows.length}{" "}
              run(s))
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger className="h-7 w-[75px] text-xs px-2">
                  {" "}
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />{" "}
                </SelectTrigger>
                <SelectContent side="top">
                  {" "}
                  {[5, 10, 20, 30].map((pageSize) => (
                    <SelectItem
                      key={pageSize}
                      value={`${pageSize}`}
                      className="text-xs"
                    >
                      Show {pageSize}
                    </SelectItem>
                  ))}{" "}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                {" "}
                <ChevronsLeft className="h-3.5 w-3.5" />{" "}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                {" "}
                <ChevronLeft className="h-3.5 w-3.5" />{" "}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                {" "}
                <ChevronRight className="h-3.5 w-3.5" />{" "}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                {" "}
                <ChevronsRight className="h-3.5 w-3.5" />{" "}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PayrollHistorySection;

// Implementation for getFilteredRowModel using TanStack Table's built-in helper
