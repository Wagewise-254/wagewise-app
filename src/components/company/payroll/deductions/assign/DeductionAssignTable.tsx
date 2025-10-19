// src/components/company/payroll/deductions/DeductionAssignTable.tsx

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
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
import { MoreHorizontal, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

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
  is_recurring: boolean;
  start_month: string;
  start_year: number;
  end_month: string | null;
  end_year: number | null;
};

// Define month order map for numerical sorting
const monthOrder: { [key: string]: number } = {
  January: 1,
  February: 2,
  March: 3,
  April: 4,
  May: 5,
  June: 6,
  July: 7,
  August: 8,
  September: 9,
  October: 10,
  November: 11,
  December: 12,
};

// Custom sorting function for Month/Year fields
const periodSort: SortingFn<AssignedDeduction> = (rowA, rowB) => {
  const a = rowA.original;
  const b = rowB.original;

  // Create a sortable integer (e.g., 202507 for July 2025)
  const sortA = a.start_year * 100 + monthOrder[a.start_month];
  const sortB = b.start_year * 100 + monthOrder[b.start_month];

  if (sortA > sortB) return 1;
  if (sortA < sortB) return -1;
  return 0;
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
        row.employee
          ? `${row.employee.first_name} ${row.employee.last_name}`
          : row.department?.name,
      id: "assigned_to",
      header: "Assigned To",
      cell: (info) => info.getValue() as string,
    },
    {
      accessorKey: "value",
      header: "Value",
      cell: (info) => {
        const row = info.row.original;
        return `${info.getValue()}${
          row.calculation_type === "Percentage" ? "%" : ""
        }`;
      },
    },
    {
      accessorKey: "calculation_type",
      header: "Calculation Type",
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
      accessorFn: (row) => `${row.start_month} ${row.start_year}`,
      id: "start_period",
      header: "Start Period",
      cell: (info) => info.getValue() as string,
      sortingFn: periodSort,
    },
    {
      accessorFn: (row) =>
        row.end_month ? `${row.end_month} ${row.end_year}` : "N/A (Ongoing)",
      id: "end_period",
      header: "End Period",
      cell: (info) => info.getValue() as string,
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
    initialState: {
      sorting: [
        {
          id: "start_period",
          desc: true, // 'true' for descending (latest date first)
        },
      ],
    },
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
