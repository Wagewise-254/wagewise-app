// src/components/dashboard/payroll/PayrollHistorySection.tsx - OVERHAULED

import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
  getPaginationRowModel,
  PaginationState,
  getFilteredRowModel,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  MoreHorizontal,
  Eye,
  RefreshCw,
  Trash2,
  RotateCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

import { API_BASE_URL } from "@/config";
import useAuthStore from "@/store/authStore";
import { formatToKsh, getStatusBadgeClass } from "@/lib/formatters";
//import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Interface matches backend response from /payroll
interface PayrollRun {
  id: string;
  payroll_number: string;
  payroll_month: string;
  status: string;
  total_net_pay: number | string;
  run_date: string;
  // Add any other fields you want to display
}

interface PayrollHistorySectionProps {
  refetchTrigger: number;
  onViewDetails: (payrollRunId: string) => void;
  onRerunInitiated: (newRunId: string, monthYear: string) => void;
}

const PayrollHistorySection: React.FC<PayrollHistorySectionProps> = ({
  refetchTrigger,
  onViewDetails,
  onRerunInitiated,
}) => {
  const { accessToken } = useAuthStore();
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const [dialogState, setDialogState] = useState<{
    type: "delete" | "rerun" | null;
    run: PayrollRun | null;
  }>({ type: null, run: null });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPayrollRuns = useCallback(
    async (showLoader = true) => {
      if (!accessToken) return;
      if (showLoader) setLoading(true);
      setError(null);
      try {
        const response = await axios.get<{ payrollRuns: PayrollRun[] }>(
          `${API_BASE_URL}/payroll`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        setPayrollRuns(response.data.payrollRuns || []);
      } catch (err) {
        setError("Failed to fetch payroll runs.");
      } finally {
        if (showLoader) setLoading(false);
      }
    },
    [accessToken]
  );

  useEffect(() => {
    fetchPayrollRuns();
  }, [fetchPayrollRuns, refetchTrigger]);

  const handleDeleteRun = async () => {
    if (dialogState.type !== "delete" || !dialogState.run) return;
    setActionLoading(true);
    try {
      await axios.delete(
        `${API_BASE_URL}/payroll/delete/${dialogState.run.id}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      toast.success(
        `Payroll for ${dialogState.run.payroll_month} has been deleted.`
      );
      fetchPayrollRuns(false); // Refetch data without full page loader
    } catch (error) {
      toast.error("Failed to delete payroll run.");
    } finally {
      setActionLoading(false);
      setDialogState({ type: null, run: null });
    }
  };

  // CHANGE: The handleRerun function is now async and calls the backend directly.
  const handleRerun = async () => {
    if (dialogState.type !== "rerun" || !dialogState.run) return;
    setActionLoading(true);
    try {
        const response = await axios.post<{ payrollRunId: string }>(
            `${API_BASE_URL}/payroll/rerun/${dialogState.run.id}`,
            {},
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        toast.info(`Rerunning payroll for ${dialogState.run.payroll_month}...`);
        // On success, call the parent component's callback with the NEW ID from the response.
       onRerunInitiated(response.data.payrollRunId, dialogState.run.payroll_month);
    } catch (error) {
        console.error("Rerun failed", error)
        toast.error("Failed to initiate payroll rerun. There might be an existing run.");
    } finally {
        setActionLoading(false);
        setDialogState({ type: null, run: null });
    }
  };

  const columns = useMemo<ColumnDef<PayrollRun>[]>(
    () => [
      {
        accessorKey: "payroll_month",
        header: "Month",
        sortingFn: "alphanumeric",
      },
      { accessorKey: "payroll_number", header: "Payroll No." },
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
      },
      {
        accessorKey: "total_net_pay",
        header: "Net Pay",
        cell: (info) => formatToKsh(info.getValue() as number),
        enableSorting: true,
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const run = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onViewDetails(run.id)}>
                  <Eye className="mr-2 h-4 w-4" /> View Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setDialogState({ type: "rerun", run })}
                >
                  <RotateCw className="mr-2 h-4 w-4" /> Rerun Payroll
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onClick={() => setDialogState({ type: "delete", run })}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Run
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [onViewDetails]
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
    <div className="bg-white rounded-b-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search history..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="h-9 max-w-sm"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchPayrollRuns(true)}
          disabled={loading}
          className="h-9"
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />{" "}
          Refresh
        </Button>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="animate-spin h-6 w-6 text-gray-400" />
        </div>
      )}
      {!loading && error && (
        <div className="text-center text-red-500 py-10">{error}</div>
      )}
      {!loading && !error && (
        <>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map(headerGroup => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <TableHead key={header.id}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No payroll history found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {/* Pagination Controls */}
          <div className="flex items-center justify-between gap-2 text-xs text-gray-600 py-3">
            <div className="flex-1 text-muted-foreground">
              {" "}
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}{" "}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </>
      )}

      <AlertDialog
        open={dialogState.type !== null}
        onOpenChange={() => setDialogState({ type: null, run: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {dialogState.type === "delete" &&
                `This will permanently delete the payroll run for ${dialogState.run?.payroll_month}. This action cannot be undone.`}
              {dialogState.type === "rerun" &&
                `This will delete the existing data for ${dialogState.run?.payroll_month} and start a new calculation process.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={
                dialogState.type === "delete" ? handleDeleteRun : handleRerun
              }
              disabled={actionLoading}
              className={
                dialogState.type === "delete"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-[#7F5EFD] hover:bg-[#6a4fcf]"
              }
            >
              {actionLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {dialogState.type === "delete"
                ? "Continue Deletion"
                : "Confirm & Rerun"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PayrollHistorySection;


