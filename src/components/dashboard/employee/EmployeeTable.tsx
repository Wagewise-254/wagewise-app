// src/components/dashboard/employee/EmployeeTable.tsx - Updated with Comprehensive Employee Interface

import React, { useState, useEffect, useMemo } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";
import axios from "axios";

// Import Shadcn UI table components
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { API_BASE_URL } from "@/config";
import useAuthStore from "@/store/authStore";

// --- DEFINITIVE EMPLOYEE INTERFACE BASED ON PROVIDED SQL SCHEMA ---
export interface Employee {
  id: string; // uuid
  company_id: string; // uuid
  employee_number: string;
  first_name: string;
  last_name: string;
  other_names: string | null;
  email: string | null;
  phone: string;
  id_type: string;
  id_number: string;
  kra_pin: string;
  shif_number: string | null;
  nssf_number: string | null;
  date_of_birth: string; // date type from backend usually string in YYYY-MM-DD
  gender: string;
  marital_status: string | null;
  citizenship: string | null;
  has_disability: boolean | null;
  disability_exemption_certificate_number: string | null;
  paye_tax_exemption: boolean | null;
  paye_exemption_certificate_number: string | null;
  date_joined: string; // date
  job_title: string | null;
  department: string | null;
  job_type: string;
  employee_status: string;
  employee_status_effective_date: string | null; // date
  end_of_probation_date: string | null; // date
  contract_start_date: string | null; // date
  contract_end_date: string | null; // date
  termination_date: string | null; // date
  termination_reason: string | null;
  basic_salary: number; // numeric(10, 2)
  salary_effective_date: string | null; // date
  payment_method: string;
  bank_name: string | null;
  bank_branch: string | null;
  bank_code: string | null;
  bank_account_number: string | null;
  mpesa_phone_number: string | null;
  is_helb_paying: boolean | null;
  helb_account_number: string | null;
  helb_monthly_deduction_amount: number; // numeric(10, 2)
  owner_occupied_interest_amount: number; // numeric(10, 2)
  pension_fund_contribution_amount: number; // numeric(10, 2)
  fbt_loan_type: string | null;
  fbt_loan_principal_amount: number | null; // numeric(10, 2)
  fbt_loan_interest_rate_charged: number | null; // numeric(5, 2)
  fbt_loan_start_date: string | null; // date
  fbt_loan_is_active: boolean;
  allowances_json: unknown[]; // jsonb, handled as array by excelUtils
  non_cash_benefits_json: unknown[]; // jsonb, handled as array by excelUtils
  other_deductions_json: unknown[]; // jsonb, handled as array by excelUtils
  physical_address: string | null;
  postal_address: string | null;
  county: string | null;
  postal_code: string | null;
  next_of_kin_name: string | null;
  next_of_kin_relationship: string | null;
  next_of_kin_phone: string | null;
  created_at: string | null; // timestamp
  updated_at: string | null; // timestamp
  created_by: string | null; // uuid
  updated_by: string | null; // uuid
}

interface EmployeeTableProps {
  searchTerm: string;
  onDataChange: () => void;
  onEditEmployee: (employee: Employee) => void;
}

const EmployeeTable: React.FC<EmployeeTableProps> = ({
  searchTerm,
  onDataChange,
  onEditEmployee,
}) => {
  const { accessToken } = useAuthStore();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingEmployeeId, setDeletingEmployeeId] = useState<string | null>(
    null
  );

  // --- Data Fetching ---
  const fetchEmployees = React.useCallback(async () => {
    if (!accessToken) {
      setError("Authentication token missing.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_BASE_URL}/employees`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.data && Array.isArray(response.data.employees)) {
        setEmployees(response.data.employees);
      } else {
        setEmployees([]);
        console.warn(
          "Unexpected response format for employees fetch:",
          response.data
        );
      }
    } catch (err: unknown) {
      console.error("Error fetching employees:", err);
      if (
        axios.isAxiosError(err) &&
        err.response &&
        typeof err.response.data === "object"
      ) {
        const backendError = err.response.data as {
          error?: string;
          message?: string;
        };
        setError(
          backendError.error ||
            backendError.message ||
            "Failed to fetch employees."
        );
      } else {
        setError("An unexpected error occurred while fetching employees.");
      }
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchEmployees();
  }, [accessToken, onDataChange, fetchEmployees]);

  // --- Define Table Columns ---
  const columns = useMemo<ColumnDef<Employee>[]>(
    () => [
      {
        accessorKey: "employee_number",
        header: "Employee No",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "first_name",
        header: "First Name",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "last_name",
        header: "Last Name",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: (info) => info.getValue() || "-",
      },
      {
        accessorKey: "job_title",
        header: "Job Title",
        cell: (info) => info.getValue() || "-",
      },
      {
        accessorKey: "employee_status",
        header: "Status",
        cell: (info) => {
          const status = info.getValue() as string;
          if (!status) return "-";
          return status.charAt(0).toUpperCase() + status.slice(1);
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const employee = row.original;

          const handleEditClick = () => {
            console.log("Editing employee:", employee.id);
            onEditEmployee(employee);
          };

          const handleDeleteClick = () => {
            console.log("Attempting to delete employee:", employee.id);
            setDeletingEmployeeId(employee.id);
          };

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  disabled={loading}
                >
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <div className="cursor-not-allowed">
                  <DropdownMenuItem onClick={handleEditClick} disabled>
                    Edit
                  </DropdownMenuItem>
                </div>

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDeleteClick}
                  className="text-red-600 focus:text-red-600"
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [loading, onEditEmployee]
  );

  // --- TanStack Table Instance ---
  const table = useReactTable({
    data: employees,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 10, // Show 6 rows per page as requested
      },
    },
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: "includesString",
    state: {
      globalFilter: searchTerm,
    },
  });

  // --- Handle Employee Deletion ---
  const handleDeleteConfirm = async () => {
    if (!deletingEmployeeId || !accessToken) return;

    console.log("Confirmed deletion for employee:", deletingEmployeeId);

    try {
      const response = await axios.delete(
        `${API_BASE_URL}/employees/${deletingEmployeeId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.data?.message) {
        toast.success(response.data.message);
        onDataChange();
      } else {
        toast.success("Employee deleted successfully.");
        onDataChange();
      }
    } catch (err: unknown) {
      console.error("Error deleting employee:", err);
      if (
        axios.isAxiosError(err) &&
        err.response &&
        typeof err.response.data === "object"
      ) {
        const backendError = err.response.data as {
          error?: string;
          message?: string;
        };
        toast.error(
          backendError.error ||
            backendError.message ||
            "Failed to delete employee."
        );
      } else {
        toast.error("An unexpected error occurred while deleting employee.");
      }
    } finally {
      setDeletingEmployeeId(null);
    }
  };

  return (
    <div className="w-full">
      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
          <span className="ml-2 text-gray-600">Loading Employees...</span>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="text-center text-red-500 py-8">
          {error}
          <Button variant="outline" className="ml-4" onClick={fetchEmployees}>
            Retry
          </Button>
        </div>
      )}

      {/* No Data State */}
      {!loading && !error && employees.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No employee data found. Use the "Add Employee" or "Import Employees"
          button to get started.
        </div>
      )}

      {/* Table Render */}
      {!loading && !error && employees.length > 0 && (
        <div className="px-3 rounded-md border bg-white">
          {/* Modern scrollbar styling */}
          <div className="overflow-auto">
            <Table className="[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
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
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Enhanced Pagination Controls */}
      {!loading &&
        !error &&
        employees.length > 0 &&
        table.getPageCount() > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2">
            <div className="text-sm text-gray-600">
              Showing{" "}
              <span className="font-medium">
                {table.getState().pagination.pageIndex *
                  table.getState().pagination.pageSize +
                  1}
              </span>{" "}
              to{" "}
              <span className="font-medium">
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) *
                    table.getState().pagination.pageSize,
                  employees.length
                )}
              </span>{" "}
              of <span className="font-medium">{employees.length}</span>{" "}
              employees
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                className="hidden sm:inline-flex"
              >
                First
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>

              <div className="flex items-center gap-1">
                {Array.from(
                  { length: Math.min(5, table.getPageCount()) },
                  (_, i) => {
                    const pageIndex =
                      Math.max(
                        0,
                        Math.min(
                          table.getPageCount() - 5,
                          table.getState().pagination.pageIndex - 2
                        )
                      ) + i;
                    if (pageIndex >= table.getPageCount()) return null;
                    return (
                      <Button
                        key={pageIndex}
                        variant={
                          table.getState().pagination.pageIndex === pageIndex
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => table.setPageIndex(pageIndex)}
                      >
                        {pageIndex + 1}
                      </Button>
                    );
                  }
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                className="hidden sm:inline-flex"
              >
                Last
              </Button>
            </div>
          </div>
        )}

      {/* AlertDialog for Deletion Confirmation */}
      <AlertDialog
        open={!!deletingEmployeeId}
        onOpenChange={(open) => !open && setDeletingEmployeeId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete employee{" "}
              <strong>
                {
                  employees.find((emp) => emp.id === deletingEmployeeId)
                    ?.first_name
                }
              </strong>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingEmployeeId(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EmployeeTable;
