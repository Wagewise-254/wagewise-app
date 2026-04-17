// src/components/company/employees/EmployeesTable.tsx

import * as React from "react";
import { useEffect } from "react";
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
  Row,
  FilterFn,
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Mail,
  Trash2,
  Inbox,
  MoreHorizontal,
  Eye,
  //Edit,
  UserX,
  AlertCircle,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "@/config";
import { Employee } from "@/types/employees";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import ConfirmationDialog from "./confirmationDialog";
import EmailComposeDialog from "@/components/common/EmailComposeDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type EmailMode = "single" | "bulk";

interface EmailDialogState {
  open: boolean;
  mode: EmailMode;
  recipients: string[];
}

// Custom filter function with proper return type
const globalFilterFn: FilterFn<Employee> = (row, _columnId, filterValue) => {
  const search = String(filterValue).toLowerCase();
  const emp = row.original;
  const fullName =
    `${emp.first_name} ${emp.middle_name || ""} ${emp.last_name}`.toLowerCase();
  const reversedName = `${emp.last_name} ${emp.first_name}`.toLowerCase();

  return (
    emp.employee_number?.toLowerCase().includes(search) ||
    fullName.includes(search) ||
    reversedName.includes(search) ||
    emp.email?.toLowerCase().includes(search) ||
    emp.job_type?.toLowerCase().includes(search) ||
    false
  );
};

const getStatusConfig = (status: string) => {
  const configs: Record<
    string,
    { bg: string; text: string; border: string; label: string }
  > = {
    ACTIVE: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      label: "Active",
    },
    "ON LEAVE": {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
      label: "On Leave",
    },
    SUSPENDED: {
      bg: "bg-purple-50",
      text: "text-purple-700",
      border: "border-purple-200",
      label: "Suspended",
    },
    TERMINATED: {
      bg: "bg-rose-50",
      text: "text-rose-700",
      border: "border-rose-200",
      label: "Terminated",
    },
    PENDING: {
      bg: "bg-slate-50",
      text: "text-slate-700",
      border: "border-slate-200",
      label: "Pending",
    },
  };

  return configs[status] || configs.PENDING;
};

const EmployeeStatusBadge = ({ status }: { status: string }) => {
  const config = getStatusConfig(status);
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium px-2 py-0.5 text-xs rounded-full border",
        config.bg,
        config.text,
        config.border,
      )}
    >
      {config.label}
    </Badge>
  );
};

interface Props {
  data: Employee[];
  loading: boolean;
  error: string | null;
  onDeleteSuccess?: () => void;
  showActions?: boolean;
  globalSearchValue?: string;
  onSearchChange?: (value: string) => void;
}

const EmployeesTable: React.FC<Props> = ({
  data,
  loading,
  error,
  onDeleteSuccess,
  showActions = true,
  globalSearchValue,
}) => {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const session = useAuthStore.getState().session;
  const [emailDialog, setEmailDialog] = useState<EmailDialogState>({
    open: false,
    mode: "single",
    recipients: [],
  });

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "employee_number", desc: false },
  ]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState({});
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState({
    open: false,
    ids: [] as string[],
  });
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Memoized counts
  const selectedCount = useMemo(
    () => Object.keys(rowSelection).length,
    [rowSelection],
  );

  // In the component, add this effect to sync external search
useEffect(() => {
  if (globalSearchValue !== undefined) {
    setGlobalFilter(globalSearchValue);
  }
}, [globalSearchValue]);

  const handleBulkDelete = () => {
    const selectedIds = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.id);
    if (selectedIds.length > 0) {
      setBulkDeleteDialog({ open: true, ids: selectedIds });
    }
  };

  const handleBulkDeleteConfirm = async () => {
    if (bulkDeleteDialog.ids.length === 0 || !companyId) return;

    const token = session?.access_token;
    if (!token) {
      toast.error("Authentication token not found");
      return;
    }

    setIsBulkDeleting(true);
    try {
      const results = await Promise.all(
        bulkDeleteDialog.ids.map((id) =>
          fetch(`${API_BASE_URL}/company/${companyId}/employees/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          }),
        ),
      );

      const failed = results.filter((r) => !r.ok);
      if (failed.length > 0) throw new Error("Some deletions failed");

      toast.success(`${bulkDeleteDialog.ids.length} employee(s) deleted`);
      setRowSelection({});
      setBulkDeleteDialog({ open: false, ids: [] });
      onDeleteSuccess?.();
    } catch (err) {
      toast.error("Failed to delete employees");
      console.error(err);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleRowClick = (employeeId: string, e: React.MouseEvent) => {
    // Don't navigate if clicking on checkbox or actions
    if (
      (e.target as HTMLElement).closest("button") ||
      (e.target as HTMLElement).closest('input[type="checkbox"]')
    ) {
      return;
    }
    navigate(`/company/${companyId}/employees/${employeeId}/personal`);
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
          className="shadow-none border-[#7F5EFD] cursor-pointer data-[state=checked]:bg-[#7F5EFD] data-[state=checked]:border-[#7F5EFD]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="shadow-none border-[#7F5EFD] cursor-pointer data-[state=checked]:bg-[#7F5EFD] data-[state=checked]:border-[#7F5EFD]"
          onClick={(e) => e.stopPropagation()}
        />
      ),
      enableSorting: false,
      size: 40,
    },
    {
      accessorKey: "employee_number",
      header: "ID",
      cell: ({ row }) => (
        <div className="font-mono text-xs font-medium text-slate-600">
          {row.getValue("employee_number")}
        </div>
      ),
      size: 100,
    },
    {
      id: "name",
      header: "Employee",
      cell: ({ row }) => {
        const emp = row.original;
        const fullName =
          `${emp.first_name} ${emp.middle_name || ""} ${emp.last_name}`
            .replace(/\s+/g, " ")
            .trim();
        return (
          <div className="flex flex-col">
            <span className="font-medium text-slate-800 text-sm">
              {fullName}
            </span>
            <span className="text-xs text-slate-400">
              {emp.job_titles?.title || "Staff"} •{" "}
              {emp.departments?.name || "N/A"}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "job_type",
      header: "Job Type",
      cell: ({ row }) => {
        const jobType = row.getValue("job_type") as string | null;
        return (
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-slate-600">{jobType || "N/A"}</span>
          </div>
        );
      },
      size: 120,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <div className="text-sm text-slate-600 truncate max-w-50">
          {row.getValue("email") || "—"}
        </div>
      ),
    },
    {
      accessorKey: "employee_status",
      header: "Status",
      cell: ({ row }) => (
        <EmployeeStatusBadge status={row.getValue("employee_status")} />
      ),
      size: 100,
    },
    ...(showActions
      ? [
          {
            id: "actions",
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }: { row: Row<Employee> }) => (
              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    const email = row.original.email;
                    if (email) {
                      setEmailDialog({
                        open: true,
                        mode: "single",
                        recipients: [email],
                      });
                    }
                  }}
                  disabled={!row.original.email}
                >
                  <Mail className="h-3.5 w-3.5" />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(
                          `/company/${companyId}/employees/${row.original.id}/personal`,
                        );
                      }}
                    >
                      <Eye className="mr-2 h-3.5 w-3.5" />
                      View
                    </DropdownMenuItem>
                    {/*<DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(
                          `/company/${companyId}/employees/${row.original.id}/edit`,
                        );
                      }}
                    >
                      <Edit className="mr-2 h-3.5 w-3.5" />
                      Edit
                    </DropdownMenuItem>*/}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-rose-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        setBulkDeleteDialog({
                          open: true,
                          ids: [row.original.id],
                        });
                      }}
                    >
                      <UserX className="mr-2 h-3.5 w-3.5" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ),
          },
        ]
      : []),
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
    globalFilterFn, // Use the properly typed filter function
    state: {
      sorting,
      columnFilters,
      rowSelection,
      globalFilter,
      pagination,
    },
    onGlobalFilterChange: setGlobalFilter,
  });

 return (
  <div className="h-full flex flex-col space-y-2">
    {/* Bulk Actions Bar - Only show when items selected */}
    {selectedCount > 0 && (
      <div className="shrink-0 flex items-center justify-between animate-in fade-in slide-in-from-top-1">
        <span className="text-xs font-medium text-slate-500">
          {selectedCount} selected
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs border-rose-200 text-rose-600 hover:bg-rose-50"
            onClick={handleBulkDelete}
          >
            <Trash2 className="mr-1 h-3 w-3" />
            Delete
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs border-blue-200 text-blue-600 hover:bg-blue-50"
            onClick={() => {
              const recipients = table
                .getSelectedRowModel()
                .rows.map((r) => r.original.email)
                .filter((email): email is string => email !== null);

              setEmailDialog({
                open: true,
                mode: "bulk",
                recipients,
              });
            }}
            disabled={
              table
                .getSelectedRowModel()
                .rows.filter((r) => r.original.email !== null).length === 0
            }
          >
            <Mail className="mr-1 h-3 w-3" />
            Email ({table.getSelectedRowModel().rows.filter((r) => r.original.email !== null).length})
          </Button>
        </div>
      </div>
    )}

    {/* Table Container with overflow auto and sticky header */}
    <div className="flex-1 overflow-auto min-h-0 rounded-sm border border-slate-200 px-1">
      <Table className="relative">
        <TableHeader className="sticky top-0 bg-slate-50 z-10 shadow-sm">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  style={{ width: header.getSize() }}
                  className="h-8 text-xs font-medium text-slate-500"
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
          {/* Loading state */}
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell colSpan={columns.length} className="h-10">
                  <div className="h-3 w-full bg-slate-100 animate-pulse rounded" />
                </TableCell>
              </TableRow>
            ))
          ) : error ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-32 text-center"
              >
                <div className="flex flex-col items-center justify-center text-rose-500">
                  <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">{error}</p>
                </div>
              </TableCell>
            </TableRow>
          ) : table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className="cursor-pointer hover:bg-slate-50/80 transition-colors group"
                onClick={(e) => handleRowClick(row.original.id, e)}
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
                className="h-32 text-center"
              >
                <div className="flex flex-col items-center justify-center text-slate-400">
                  <Inbox className="h-8 w-8 mb-2 opacity-20" />
                  <p className="text-sm">No employees found</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>

   {/* Pagination - Matching Payroll History style */}
{table.getPageCount() > 1 && (
  <div className="shrink-0 flex items-center justify-between pt-2">
    <p className="text-xs text-slate-400">
      Showing {table.getRowModel().rows.length} of {data.length} results
    </p>
    <div className="flex items-center space-x-2">
      <Select
        value={pagination.pageSize.toString()}
        onValueChange={(value) => {
          table.setPageSize(Number(value));
          setPagination(prev => ({ ...prev, pageSize: Number(value), pageIndex: 0 }));
        }}
      >
        <SelectTrigger className="h-7 w-16 text-xs border-slate-200 rounded-md">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {[10, 25, 50, 100].map((pageSize) => (
            <SelectItem key={pageSize} value={pageSize.toString()}>
              {pageSize}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
          className="h-7 w-7 p-0"
        >
          <ChevronsLeft className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="h-7 w-7 p-0"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <span className="text-xs text-slate-600 px-2">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="h-7 w-7 p-0"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
          className="h-7 w-7 p-0"
        >
          <ChevronsRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  </div>
)}

    {/* Dialogs remain the same */}
    <EmailComposeDialog
      open={emailDialog.open}
      mode={emailDialog.mode}
      recipients={emailDialog.recipients}
      onClose={() => setEmailDialog((prev) => ({ ...prev, open: false }))}
    />

    <ConfirmationDialog
      isOpen={bulkDeleteDialog.open}
      onClose={() => setBulkDeleteDialog({ open: false, ids: [] })}
      onConfirm={handleBulkDeleteConfirm}
      title={`Delete ${bulkDeleteDialog.ids.length} Employee${bulkDeleteDialog.ids.length !== 1 ? "s" : ""}`}
      description="This action cannot be undone. The employees will be permanently removed."
      isConfirming={isBulkDeleting}
    />
  </div>
);
};

export default EmployeesTable;
