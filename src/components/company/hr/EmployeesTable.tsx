import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useParams } from 'react-router-dom';
import { useHrStore, Employee } from '@/stores/hrStore';
import { toast } from 'sonner';

import ConfirmationDialog from '@/components/company/hr/ConfirmationDialog';
import EditEmployeeDialog from './EditEmployeeDialog';
import ChangeEmployeeStatusDialog from './ChangeEmployeeStatusDialog';

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
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "first_name",
    header: "First Name",
    cell: ({ row }) => <div>{row.getValue("first_name")}</div>,
  },
  {
    accessorKey: "last_name",
    header: "Last Name",
    cell: ({ row }) => <div>{row.getValue("last_name")}</div>,
  },
  {
    accessorKey: "employee_number",
    header: "Employee Number",
    cell: ({ row }) => <div>{row.getValue("employee_number")}</div>,
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => <div>{row.getValue("email")}</div>,
  },
  {
    accessorKey: "department_id",
    header: "Department",
    cell: ({ row }) => {
      const department = row.original.departments;
      return <div>{department?.name || 'N/A'}</div>;
    },
  },
  {
    accessorKey: "job_title",
    header: "Job Title",
    cell: ({ row }) => <div>{row.getValue("job_title")}</div>,
  },
  {
    accessorKey: "employee_status",
    header: "Status",
    cell: ({ row }) => <div>{row.getValue("employee_status")}</div>,
  },
  {
    accessorKey: "date_joined",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date Joined
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div>{new Date(row.getValue("date_joined")).toLocaleDateString()}</div>,
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row, table }) => {
      const employee = row.original;
      const { onEditClick, onChangeStatusClick, onDeleteClick } = table.options.meta as {
        onEditClick: (employee: Employee) => void;
        onChangeStatusClick: (employee: Employee) => void;
        onDeleteClick: (employee: Employee) => void;
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(employee.id)}
            >
              Copy Employee ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEditClick(employee)}>
              Edit Employee
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onChangeStatusClick(employee)}>
              Change Status
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDeleteClick(employee)}>
              Delete Employee
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export default function EmployeesTable() {
  const { companyId } = useParams();
  const { employees, loading, deleteEmployee } = useHrStore();

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  
  // State for Edit Dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [selectedEmployee, setSelectedEmployee] = React.useState<Employee | null>(null);

  // State for Change Status Dialog
  const [isStatusDialogOpen, setIsStatusDialogOpen] = React.useState(false);
  const [employeeToChangeStatus, setEmployeeToChangeStatus] = React.useState<Employee | null>(null);

  // State for Delete Dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [employeeToDelete, setEmployeeToDelete] = React.useState<Employee | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleEditClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsEditDialogOpen(true);
  };
  
  const handleEditDialogClose = () => {
    setIsEditDialogOpen(false);
    setSelectedEmployee(null);
  };

  const handleChangeStatusClick = (employee: Employee) => {
    setEmployeeToChangeStatus(employee);
    setIsStatusDialogOpen(true);
  };

  const handleChangeStatusClose = () => {
    setIsStatusDialogOpen(false);
    setEmployeeToChangeStatus(null);
  };

  const handleDeleteClick = (employee: Employee) => {
    setEmployeeToDelete(employee);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!employeeToDelete || !companyId) return;

    setIsDeleting(true);
    const success = await deleteEmployee(companyId, employeeToDelete.id);
    setIsDeleting(false);

    if (success) {
      toast.success('Employee deleted successfully.');
      setIsDeleteDialogOpen(false);
      setEmployeeToDelete(null);
    } else {
      toast.error('Failed to delete employee.');
    }
  };

  const table = useReactTable({
    data: employees,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    meta: {
      onEditClick: handleEditClick,
      onChangeStatusClick: handleChangeStatusClick,
      onDeleteClick: handleDeleteClick,
    },
  });

  if (!companyId) {
    return <div>Error: Company ID not found.</div>;
  }

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter employees..."
          value={(table.getColumn("first_name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("first_name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border px-2">
        <Table>
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
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex items-center justify-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
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
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
      
      <EditEmployeeDialog
        isOpen={isEditDialogOpen}
        onClose={handleEditDialogClose}
        employee={selectedEmployee}
      />
      <ChangeEmployeeStatusDialog
        isOpen={isStatusDialogOpen}
        onClose={handleChangeStatusClose}
        employee={employeeToChangeStatus}
      />
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Are you sure you want to delete this employee?"
        description="This action cannot be undone. This will permanently delete the employee record."
        isConfirming={isDeleting}
      />
    </div>
  );
}