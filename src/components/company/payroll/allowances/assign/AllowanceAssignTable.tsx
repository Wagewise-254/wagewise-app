// src/components/company/payroll/allowances/AllowanceAssignTable.tsx

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { format } from "date-fns";

// Updated type definition to match allowances backend schema
export type Allowance = {
  id: string;
  allowance_type_id: string;
  company_id: string;
  employee_id: string | null;
  department_id: string | null;
  value: number;
  calculation_type: "Fixed" | "Percentage";
  is_active: boolean;
  start_date: string;
  end_date: string | null;
  created_at: string;
  allowance_types: {
    name: string;
    is_cash: boolean;
    is_taxable: boolean;
  };
  employees: {
    first_name: string;
    last_name: string;
  };
};

interface Props {
  data: Allowance[];
  onEdit: (allowance: Allowance) => void;
  onDelete: (allowance: Allowance) => void;
}

const AllowanceAssignTable: React.FC<Props> = ({ data, onEdit, onDelete }) => {
  const [globalFilter, setGlobalFilter] = useState("");

  const columns: ColumnDef<Allowance>[] = [
    {
      accessorKey: "allowance_types.name",
      header: "Allowance Type",
      cell: (info) => info.getValue() as string,
    },
    {
      accessorKey: "employees.first_name",
      header: "Employee Name",
      cell: ({ row }) => {
        const employee = row.original.employees;
        if (!employee) return "N/A";
        return `${employee.first_name} ${employee.last_name}`;
      },
    },
    {
      accessorKey: "value",
      header: "Value",
      cell: (info) => (info.getValue() as number).toFixed(2),
    },
    {
      accessorKey: "calculation_type",
      header: "Type",
      cell: (info) => info.getValue() as string,
    },
    {
      accessorKey: "start_date",
      header: "Start Date",
      cell: (info) => {
        const date = info.getValue() as string;
        return format(new Date(date), "PPP");
      },
    },
    {
      accessorKey: "end_date",
      header: "End Date",
      cell: (info) => {
        const date = info.getValue() as string | null;
        if (!date) return "N/A";
        return format(new Date(date), "PPP");
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
            <DropdownMenuItem onClick={() => onEdit(row.original)}>Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(row.original)}>Delete</DropdownMenuItem>
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
    globalFilterFn: (row, _columnId, filterValue) => {
    // Get the employee name from the row
    const employeeName = `${row.original.employees.first_name} ${row.original.employees.last_name}`;
    // Check if the employee name (case-insensitive) includes the filter value
    return employeeName.toLowerCase().includes(filterValue.toLowerCase());
  },
    onGlobalFilterChange: setGlobalFilter,
    state: {
      globalFilter,
    },
  });

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search by employee name..."
        value={globalFilter ?? ""}
        onChange={(event) => setGlobalFilter(event.target.value)}
        className="max-w-sm"
      />
      <div className="rounded-md border px-2">
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
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
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
  );
};

export default AllowanceAssignTable;