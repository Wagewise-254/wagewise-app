// src/components/company/payroll/deductions/DeductionAssignTable.tsx

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  RowSelectionState,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  SortingFn,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Check, X, Trash2, Building, Users, Briefcase } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

// Define the type for an assigned Deduction matching backend schema
export type AssignedDeduction = {
  id: string;
  deduction_type_id: string;
  company_id: string;
  employee_id: string | null;
  department_id: string | null;
  sub_department_id: string | null;
  job_title_id: string | null;
  value: number;
  calculation_type: "FIXED" | "PERCENTAGE";
  is_recurring: boolean;
  start_date: string;
  number_of_months: number | null;
  end_date: string | null;
  created_at: string;
  applies_to: "INDIVIDUAL" | "COMPANY" | "DEPARTMENT" | "SUB_DEPARTMENT" | "JOB_TITLE";
   metadata: Record<string, unknown>;
  deduction_types: {
    name: string;
    code: string;
    is_pre_tax: boolean;
  };
  employees?: {
    first_name: string;
    last_name: string;
    employee_number: string;
  };
  departments?: {
    name: string;
  };
  sub_departments?: {
    name: string;
  };
  job_titles?: {
    title: string;
  };
};

// Helper function to get recipient display name
const getRecipientDisplay = (deduction: AssignedDeduction) => {
  switch (deduction.applies_to) {
    case "INDIVIDUAL":
      return deduction.employees
        ? `${deduction.employees.first_name} ${deduction.employees.last_name}`
        : "Unknown Employee";
    case "COMPANY":
      return "All Employees";
    case "DEPARTMENT":
      return deduction.departments?.name || "Unknown Department";
    case "SUB_DEPARTMENT":
      return deduction.sub_departments?.name || "Unknown Sub-department";
    case "JOB_TITLE":
      return deduction.job_titles?.title || "Unknown Job Title";
    default:
      return "N/A";
  }
};

// Helper function to get recipient icon
const getRecipientIcon = (applies_to: string) => {
  switch (applies_to) {
    case "INDIVIDUAL":
      return null;
    case "COMPANY":
      return <Building className="h-3 w-3 mr-1" />;
    case "DEPARTMENT":
    case "SUB_DEPARTMENT":
      return <Users className="h-3 w-3 mr-1" />;
    case "JOB_TITLE":
      return <Briefcase className="h-3 w-3 mr-1" />;
    default:
      return null;
  }
};

// Custom sorting function for dates
const dateSort: SortingFn<AssignedDeduction> = (rowA, rowB) => {
  const a = new Date(rowA.original.start_date).getTime();
  const b = new Date(rowB.original.start_date).getTime();
  return a - b;
};

interface Props {
  data: AssignedDeduction[];
  onEdit: (deduction: AssignedDeduction) => void;
  onDelete: (deduction: AssignedDeduction) => void;
  onBulkDeleteClick: (deductionIds: string[]) => void;
}

const BulkDeleteButton = ({
  table,
  onBulkDeleteClick,
}: {
  table: ReturnType<typeof useReactTable<AssignedDeduction>>;
  onBulkDeleteClick: (deductionIds: string[]) => void;
}) => {
  const selectedRowCount = Object.keys(table.getState().rowSelection).length;

  if (selectedRowCount === 0) {
    return null;
  }

  const handleBulkDelete = () => {
    const selectedIds = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.id);
    onBulkDeleteClick(selectedIds);
  };

  return (
    <Button
      variant="destructive"
      className="flex items-center space-x-2 ml-4 text-white"
      onClick={handleBulkDelete}
    >
      <Trash2 className="h-4 w-4" />
      <span>Delete ({selectedRowCount})</span>
    </Button>
  );
};

const DeductionAssignTable: React.FC<Props> = ({
  data,
  onEdit,
  onDelete,
  onBulkDeleteClick,
}) => {
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const columns: ColumnDef<AssignedDeduction>[] = [
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
      accessorKey: "deduction_types.name",
      header: "Deduction Type",
      cell: ({ row }) => {
        const deductionType = row.original.deduction_types;
        return (
          <div>
            <div className="flex items-center gap-2">
              <span>{deductionType.name}</span>
              {deductionType.is_pre_tax && (
                <Badge variant="secondary" className="text-xs">
                  Pre-tax
                </Badge>
              )}
            </div>
          </div>
        );
      },
    },
    {
      id: "recipient",
      header: "Assigned To",
      cell: ({ row }) => {
        const deduction = row.original;
        const icon = getRecipientIcon(deduction.applies_to);
        const display = getRecipientDisplay(deduction);
        
        return (
          <div className="flex items-center">
            {icon}
            <span>{display}</span>
            {deduction.applies_to !== "INDIVIDUAL" && deduction.applies_to !== "COMPANY" && (
              <Badge variant="outline" className="ml-2 text-xs">
                {deduction.applies_to.replace("_", " ")}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "value",
      header: "Value",
      cell: ({ row }) => {
        const deduction = row.original;
        return (
          <span className="font-medium">
            {deduction.value.toLocaleString()}
            {deduction.calculation_type === "PERCENTAGE" ? "%" : ""}
          </span>
        );
      },
    },
    {
      accessorKey: "calculation_type",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.calculation_type === "FIXED" ? "Fixed" : "Percentage"}
        </Badge>
      ),
    },
    {
      accessorKey: "is_recurring",
      header: "Recurring",
      cell: ({ row }) =>
        row.original.is_recurring ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <X className="h-4 w-4 text-red-500" />
        ),
    },
    {
      accessorKey: "start_date",
      header: "Start Date",
      cell: ({ row }) => new Date(row.original.start_date).toLocaleDateString(),
      sortingFn: dateSort,
    },
    {
      accessorKey: "end_date",
      header: "End Date",
      cell: ({ row }) => {
        const deduction = row.original;
        if (!deduction.is_recurring && deduction.end_date) {
          return new Date(deduction.end_date).toLocaleDateString();
        }
        if (deduction.is_recurring && deduction.end_date) {
          return new Date(deduction.end_date).toLocaleDateString();
        }
        return <span className="text-muted-foreground">Ongoing</span>;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(row.original)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(row.original)}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    initialState: {
      sorting: [
        {
          id: "start_date",
          desc: true,
        },
      ],
    },
    globalFilterFn: (row, _columnId, filterValue) => {
      const deduction = row.original;
      const searchStr = filterValue.toLowerCase();
      
      // Search by deduction type
      if (deduction.deduction_types.name.toLowerCase().includes(searchStr)) return true;
      
      // Search by recipient
      const recipientDisplay = getRecipientDisplay(deduction).toLowerCase();
      if (recipientDisplay.includes(searchStr)) return true;
      
      return false;
    },
    onGlobalFilterChange: setGlobalFilter,
    state: {
      globalFilter,
      rowSelection,
      pagination,
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center py-4">
        <Input
          placeholder="Search by deduction type or recipient..."
          value={globalFilter ?? ""}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="max-w-sm rounded-sm shadow-none"
        />
        <BulkDeleteButton table={table} onBulkDeleteClick={onBulkDeleteClick} />
      </div>

      <div className="rounded-sm shadow-none px-2  border border-slate-300">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
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
                  No deductions found.
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
    </div>
  );
};

export default DeductionAssignTable;