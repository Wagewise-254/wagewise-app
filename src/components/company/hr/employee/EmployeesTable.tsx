import * as React from "react"
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
} from "@tanstack/react-table"
import { MoreHorizontal, Trash2} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
} from "@/components/ui/pagination"
import { useParams } from 'react-router-dom';
import { useHrStore, Employee } from '@/stores/hrStore';
import { toast } from 'sonner';

import ConfirmationDialog from '@/components/company/hr/employee/ConfirmationDialog';
import EditEmployeeDialog from './EditEmployeeDialog';
import ChangeEmployeeStatusDialog from './ChangeEmployeeStatusDialog';
import EmployeeDetailsDialog from "./EmployeeDetailsDialog"

const EmployeeStatusBadge = ({ status }: { status: string }) => {
  const getVariant = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'On Leave':
        return 'bg-orange-100 text-orange-800';
      case 'Terminated':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  return <Badge className={getVariant(status)}>{status}</Badge>;
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
    accessorKey: "employee_number",
    header: "Employee No.",
    cell: ({ row }) => <div>{row.getValue("employee_number")}</div>,
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const employee = row.original;
      return <div>{`${employee.first_name} ${employee.last_name}`}</div>;
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => <div>{row.getValue("email")}</div>,
  },
  {
    accessorKey: "departments.name",
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
    cell: ({ row }) => <EmployeeStatusBadge status={row.getValue("employee_status")} />,
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row, table }) => {
      const employee = row.original;
      const { onEditClick, onChangeStatusClick, onBulkDeleteClick, onViewDetailsClick } = table.options.meta as {
        onEditClick: (employee: Employee) => void;
        onChangeStatusClick: (employee: Employee) => void;
        onBulkDeleteClick: (employeeIds: string[]) => void;
        onViewDetailsClick: (employee: Employee) => void;
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
            <DropdownMenuItem onClick={() => onViewDetailsClick(employee)}>
              View Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEditClick(employee)}>
              Edit Employee
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onChangeStatusClick(employee)}>
              Change Status
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-500" onClick={() => onBulkDeleteClick([employee.id])}>
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
  const { employees, deleteEmployee, deleteEmployees} = useHrStore();

   const [sorting, setSorting] = React.useState<SortingState>([
    {
      id: "employee_number",
      desc: false, // 'false' for ascending
    },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState('');

  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = React.useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = React.useState(false);

  const [selectedEmployee, setSelectedEmployee] = React.useState<Employee | null>(null);
  const [employeeToChangeStatus, setEmployeeToChangeStatus] = React.useState<Employee | null>(null);
  const [employeesToDelete, setEmployeesToDelete] = React.useState<string[]>([]);
  
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = React.useState(false);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const handleEditClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsEditDialogOpen(true);
  };

  const handleChangeStatusClick = (employee: Employee) => {
    setEmployeeToChangeStatus(employee);
    setIsStatusDialogOpen(true);
  };

  const handleDeleteClick = (employeeId: string) => {
    setEmployeesToDelete([employeeId]);
    setIsDeleteDialogOpen(true);
  };

  const handleBulkDelete = () => {
    const selectedIds = table.getSelectedRowModel().rows.map(row => row.original.id);
    if (selectedIds.length > 0) {
      setEmployeesToDelete(selectedIds);
      setIsBulkDeleteDialogOpen(true);
    }
  };

  const handleViewDetails = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsDetailsDialogOpen(true);
  };

  const handleSingleDeleteConfirm = async () => {
    if (!employeesToDelete[0] || !companyId) return;
    setIsDeleting(true);
    const success = await deleteEmployee(companyId, employeesToDelete[0]);
    setIsDeleting(false);
    if (success) {
      toast.success('Employee deleted successfully.');
      setIsDeleteDialogOpen(false);
    } else {
      toast.error('Failed to delete employee.');
    }
  };

  const handleBulkDeleteConfirm = async () => {
    if (employeesToDelete.length === 0 || !companyId) return;
    setIsBulkDeleting(true);
    const success = await deleteEmployees(companyId, employeesToDelete);
    setIsBulkDeleting(false);
    if (success) {
      toast.success(`${employeesToDelete.length} employee(s) deleted successfully.`);
      setIsBulkDeleteDialogOpen(false);
      setRowSelection({});
    } else {
      toast.error('Failed to delete employees.');
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
      
      const employeeNumber = String(row.original.employee_number || '').toLowerCase();
      const firstName = String(row.original.first_name || '').toLowerCase();
      const lastName = String(row.original.last_name || '').toLowerCase();
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
      onEditClick: handleEditClick,
      onChangeStatusClick: handleChangeStatusClick,
      onBulkDeleteClick: handleDeleteClick,
      onViewDetailsClick: handleViewDetails,
    }
  });

  const selectedRowCount = Object.keys(rowSelection).length;


  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Search employees..."
          value={globalFilter ?? ''}
          onChange={event => setGlobalFilter(event.target.value)}
          className="max-w-sm mr-2"
        />
        {selectedRowCount > 0 && (
          <Button
            variant="destructive"
            className="flex items-center space-x-2 text-white"
            onClick={handleBulkDelete}
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete ({selectedRowCount})</span>
          </Button>
        )}
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
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No employees found.
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
                className={!table.getCanPreviousPage() ? "cursor-not-allowed opacity-50" : ""}
              />
            </PaginationItem>
            {Array.from({ length: table.getPageCount() }, (_, index) => (
              <PaginationItem key={index}>
                <PaginationLink
                  isActive={table.getState().pagination.pageIndex === index}
                  onClick={() => table.setPageIndex(index)}
                >
                  {index + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => table.nextPage()}
                className={!table.getCanNextPage() ? "cursor-not-allowed opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
      
      {/* Dialogs */}
      <EditEmployeeDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        employee={selectedEmployee}
      />
      <ChangeEmployeeStatusDialog
        isOpen={isStatusDialogOpen}
        onClose={() => setIsStatusDialogOpen(false)}
        employee={employeeToChangeStatus}
      />
      <EmployeeDetailsDialog
        isOpen={isDetailsDialogOpen}
        onClose={() => setIsDetailsDialogOpen(false)}
        employee={selectedEmployee}
      />
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleSingleDeleteConfirm}
        title="Are you sure you want to delete this employee?"
        description="This action cannot be undone. This will permanently delete the employee record."
        isConfirming={isDeleting}
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
}

// Create a simple dialog for now to fulfill the view details request
/*
const EmployeeDetailsDialog = ({ isOpen, onClose, employee }: { isOpen: boolean, onClose: () => void, employee: Employee | null }) => {
  if (!isOpen || !employee) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold">Employee Details</h2>
        <p className="mt-4">
          Details for: <strong>{employee.first_name} {employee.last_name}</strong>
        </p>
        <div className="mt-6 flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}; */