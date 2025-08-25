// src/components/company/payroll/deductions/DeductionAssignTable.tsx

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
import { MoreHorizontal, Check, X} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
//import { Employee, DeductionType } from "./DeductionAssignSection";

// Define the type for an assigned Deduction
export type AssignedDeduction = {
  id: string;
  deduction_type_id: string;
  deduction_type: { name: string };
  employee_id: string | null;
  employee: { first_name: string; last_name: string } | null;
  department_id: string | null;
  department: { name: string } | null;
  value: number;
  calculation_type: "Fixed" | "Percentage";
  is_active: boolean;
  is_one_time: boolean;
  start_date: string;
  end_date: string | null;
};


interface Props {
  data: AssignedDeduction[];
  onEdit: (deduction: AssignedDeduction) => void;
  onDelete: (deduction: AssignedDeduction) => void;
}

const DeductionAssignTable: React.FC<Props> = ({ data, onEdit, onDelete }) => {
  const [globalFilter, setGlobalFilter] = useState("");

  const columns: ColumnDef<AssignedDeduction>[] = [
    {
      accessorKey: "deduction_type.name",
      header: "Deduction Type",
      cell: (info) => info.getValue() as string,
    },
    {
      accessorFn: (row) =>
        row.employee ? `${row.employee.first_name} ${row.employee.last_name}` : row.department?.name,
      id: "assigned_to",
      header: "Assigned To",
      cell: (info) => info.getValue() as string,
    },
    {
      accessorKey: "value",
      header: "Value",
      cell: (info) => {
        const row = info.row.original;
        return `${info.getValue()}${row.calculation_type === "Percentage" ? "%" : ""}`;
      },
    },
    {
      accessorKey: "calculation_type",
      header: "Calculation Type",
    },
    {
      accessorKey: "is_active",
      header: "Active?",
      cell: ({ row }) => (
        row.original.is_active ? <Check className="h-4 w-4 text-green-500" /> :  <X className="h-4 w-4 text-red-500" />
      ),
    },
    {
      accessorKey: "is_one_time",
      header: "One Time?",
      cell: ({ row }) => (
        row.original.is_one_time ? <Check className="h-4 w-4 text-green-500" /> :  <X className="h-4 w-4 text-red-500" />
      ),
    },
    {
      accessorKey: "start_date",
      header: "Start Date",
      cell: (info) => new Date(info.getValue() as string).toLocaleDateString(),
    },
    {
      accessorKey: "end_date",
      header: "End Date",
      cell: (info) =>
        info.getValue() ? new Date(info.getValue() as string).toLocaleDateString() : "Ongoing",
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
    onGlobalFilterChange: setGlobalFilter,
    state: {
      globalFilter,
    },
  });

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search assigned deductions..."
        value={globalFilter ?? ""}
        onChange={(event) => setGlobalFilter(event.target.value)}
        className="max-w-sm"
      />
      <div className="rounded-md border">
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

export default DeductionAssignTable;