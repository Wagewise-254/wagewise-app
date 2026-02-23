// src/components/company/payroll/deductions/DeductionAssignTable.tsx

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Trash2, Inbox, Search } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_BASE_URL } from '@/config';
import { Employee } from "@/types/employees";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import ConfirmationDialog from "./confirmationDialog";
import EmailComposeDialog from "@/components/common/EmailComposeDialog";

type EmailMode = "single" | "bulk";

interface EmailDialogState {
  open: boolean;
  mode: EmailMode;
  recipients: string[]; // emails
}
const toProperCase = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const EmployeeStatusBadge = ({ status }: { status: string }) => {
  const getVariant = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "On Leave":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Terminated":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };
  return (
    <Badge variant="outline" className={`${getVariant(status)} font-medium`}>
      {status}
    </Badge>
  );
};

interface Props {
  data: Employee[];
  loading: boolean;
  error: string | null;
  onDeleteSuccess?: () => void;
}

const EmployeesTable: React.FC<Props> = ({ data, loading, error,  onDeleteSuccess }) => {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const session = useAuthStore.getState().session;
  const [emailDialog, setEmailDialog] = React.useState<EmailDialogState>({
    open: false,
    mode: "single",
    recipients: [],
  });

  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "employee_number", desc: false },
  ]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = React.useState({});
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] =
    React.useState(false);
 // const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [employeesToDelete, setEmployeesToDelete] = React.useState<string[]>(
    [],
  );
  const [isBulkDeleting, setIsBulkDeleting] = React.useState(false);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
 
  /*
  const handleDeleteClick = (employeeId: string) => {
    setEmployeesToDelete([employeeId]);
    setIsDeleteDialogOpen(true);
  }; */

  const handleBulkDelete = () => {
    const selectedIds = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.id);
    if (selectedIds.length > 0) {
      setEmployeesToDelete(selectedIds);
      setIsBulkDeleteDialogOpen(true);
    }
  };

  const handleBulkDeleteConfirm = async () => {
    setIsBulkDeleting(true);
    if (employeesToDelete.length === 0 || !companyId) return;

    const token = session?.access_token;

    if (!token) {
      toast.error("Authentication token not found. Please log in again.");
      return;
    }

    try {
      // This implementation sends a separate delete request for each employee
      const results = await Promise.all(employeesToDelete.map(employeeToDelete =>
        fetch(`${API_BASE_URL}/company/${companyId}/employees/${employeeToDelete}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
      ));

      //const successfulDeletes = results.filter(res => res.ok);
      const failedDeletes = results.filter(res => !res.ok);

      if (failedDeletes.length > 0) {
        throw new Error('Failed to delete some employees.');
      }

      toast.success(
        `${employeesToDelete.length} employee(s) deleted successfully.`,
      );
      setRowSelection({});
     setIsBulkDeleteDialogOpen(false);

      // Call the callback to refresh data
      if (onDeleteSuccess) {
        onDeleteSuccess();
      }
      

    } catch (err: unknown) {
      toast.error("Failed to delete employees.");
      console.error((err as Error).message);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const columns: ColumnDef<Employee>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-o.5 shadow-none cursor-pointer"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-0.5 shadow-none cursor-pointer "
          onClick={(e) => e.stopPropagation()}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "employee_number",
      header: "Employee No.",
      cell: ({ row }) => <div>{row.getValue("employee_number")}</div>,
    },
    {
      accessorKey: "name",
      header: "Full Names",
      cell: ({ row }) => {
        const emp = row.original;
        return (
          <div className="flex flex-col py-1">
            <span className="font-semibold text-slate-800">{`${emp.first_name} ${emp.last_name}`}</span>
            <span className="text-[11px] text-slate-400 tracking-tight">
              {emp.job_titles?.title || "Staff"}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "departments.name",
      header: "Department",
      cell: ({ row }) => (
        <span className="text-slate-600">
          {row.original.departments?.name || "N/A"}
        </span>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <div>{row.getValue("email")}</div>,
    },
    {
      accessorKey: "sub_departments.name",
      header: "Section/Project",
      cell: ({ row }) => {
        const subDepartment = row.original.sub_departments;
        return (
          <div className="">{subDepartment?.name || "🚫 Not assigned"}</div>
        );
      },
    },
    {
      accessorKey: "job_type",
      header: "Type",
      cell: ({ row }) => <div>{row.getValue("job_type")}</div>,
    },
    {
      accessorKey: "employee_status",
      header: "Status",
      cell: ({ row }) => (
        <EmployeeStatusBadge status={toProperCase(row.getValue("employee_status"))}/>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 cursor-pointer text-slate-400 hover:text-blue-600 hover:bg-blue-50"
            onClick={() =>
              setEmailDialog({
                open: true,
                mode: "single",
                recipients: [row.original.email as string],
              })
            }
          >
            <Mail className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];
  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      rowSelection,
      globalFilter,
      pagination,
    },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const searchTerm = String(filterValue).toLowerCase();

      const employeeNumber = String(
        row.original.employee_number || "",
      ).toLowerCase();
      const firstName = String(row.original.first_name || "").toLowerCase();
      const lastName = String(row.original.last_name || "").toLowerCase();
      const fullName = `${firstName} ${lastName}`;
      const reversedFullName = `${lastName} ${firstName}`;

      return (
        employeeNumber.includes(searchTerm) ||
        firstName.includes(searchTerm) ||
        lastName.includes(searchTerm) ||
        fullName.includes(searchTerm) ||
        reversedFullName.includes(searchTerm)
      );
    },
    meta: {
      //onBulkDeleteClick: handleDeleteClick,
    },
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm mt-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name or ID..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9 bg-slate-50/50 border-slate-300 rounded-sm shadow-none focus-visible:ring-1 focus-visible:ring-blue-500"
          />
        </div>

        {/**Bulk Action Toolbar */}
        {selectedRows.length > 0 && (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
            <Button
              variant="outline"
              size="sm"
              className="text-rose-600 border-rose-200 hover:bg-rose-50 shadow-none h-9 cursor-pointer"
              onClick={handleBulkDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete ({selectedRows.length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-blue-600 border-blue-200 cursor-pointer hover:bg-blue-50 shadow-none h-9"
              onClick={() =>
                setEmailDialog({
                  open: true,
                  mode: "bulk",
                  recipients: selectedRows
                    .map((r) => r.original.email as string)
                    .filter(Boolean),
                })
              }
            >
              <Mail className="mr-2 h-4 w-4" />
              Send Email ({selectedRows.length})
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-sm border border-slate-300 px-2">
        <Table>
          <TableHeader className="bg-slate-50/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="hover:bg-transparent border-slate-200"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-slate-500 font-medium h-10 text-xs tracking-wider"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={columns.length} className="py-3">
                    <div className="h-4 w-full rounded bg-slate-100 animate-pulse" />
                  </TableCell>
                </TableRow>
              ))
            ) : error ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-48 text-center"
                >
                  <span className="text-red-500 text-sm">{error}</span>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="cursor-pointer transition-colors border-slate-100 hover:bg-slate-50/50"
                  onClick={() =>
                    navigate(
                      `/company/${companyId}/employees/${row.original.id}/personal`,
                    )
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-2">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-48 text-center"
                >
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <Inbox className="h-10 w-10 mb-2 opacity-20" />
                    <p className="text-sm">No employees found.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-center mt-4">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => table.previousPage()}
                className={
                  !table.getCanPreviousPage()
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
            {Array.from({ length: table.getPageCount() }, (_, index) => (
              <PaginationItem key={index}>
                <PaginationLink
                  isActive={table.getState().pagination.pageIndex === index}
                  onClick={() => table.setPageIndex(index)}
                  className="cursor-pointer"
                >
                  {index + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => table.nextPage()}
                className={
                  !table.getCanNextPage()
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
      <EmailComposeDialog
        open={emailDialog.open}
        mode={emailDialog.mode}
        recipients={emailDialog.recipients}
        onClose={() => setEmailDialog((prev) => ({ ...prev, open: false }))}
      />

      <ConfirmationDialog
        isOpen={isBulkDeleteDialogOpen}
        onClose={() => setIsBulkDeleteDialogOpen(false)}
        onConfirm={handleBulkDeleteConfirm}
        title={`Are you sure you want to delete ${employeesToDelete.length} employee(s)?`}
        description="This action cannot be undone. This will permanently delete the employee records."
        isConfirming={isBulkDeleting}
      />
    </div>
  );
};

export default EmployeesTable;
