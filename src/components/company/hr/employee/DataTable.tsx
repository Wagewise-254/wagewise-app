import * as React from "react";
// Fixed the import path to use a CDN for the browser environment.
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  ColumnDef,
  SortingState,
  flexRender,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
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
import { MoreHorizontal } from "lucide-react";

// This Employee type should be the single source of truth for employee data structure.
// It's often a good idea to have this in a central types file (e.g., types/index.ts).
export type Employee = {
  id: string;
  first_name: string; // Add this
  last_name: string; // Add this
  employee_number: string;
  employee_bank_details?: { // Add this nested object
    payment_method: "Cash" | "Bank" | "M-Pesa";
    bank_name?: string;
    account_number?: string;
    bank_code?: string;
    branch_code?: string;
    phone_number?: string;
  };
};

interface DataTableProps {
  data: Employee[];
  onEdit: (employee: Employee) => void;
}

export function DataTable({ data, onEdit }: DataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
  {
    id: "employee_number",
    desc: false, // 'false' for ascending
  },
]);

  // Define table columns, making them reusable and type-safe.
  const columns: ColumnDef<Employee>[] = [
    {
      accessorKey: "employee_number",
      header: "Employee No.",
    },
    {
      cell: ({ row }) => (
      <span>
        {row.original.first_name} {row.original.last_name}
      </span>
    ),
      header: "Employee Name",
    },   
    {
      accessorKey: "employee_bank_details.payment_method",
      header: "Payment Method",
    },
    {
      header: "Bank Name",
    accessorKey: "employee_bank_details.bank_name",
    cell: ({ row }) =>
      row.original.employee_bank_details?.payment_method === "Bank"
        ? row.original.employee_bank_details?.bank_name || "-"
        : "-",
    },
    {
      header: "Account No.",
    accessorKey: "employee_bank_details.account_number",
    cell: ({ row }) =>
      row.original.employee_bank_details?.payment_method === "Bank"
        ? row.original.employee_bank_details?.account_number || "-"
        : "-",
    },
    {
        header: "M-Pesa No.",
    accessorKey: "employee_bank_details.phone_number",
    cell: ({ row }) =>
      row.original.employee_bank_details?.payment_method === "M-Pesa"
        ? row.original.employee_bank_details?.phone_number || "-"
        : "-",
      },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const employee = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(employee)}>
                Edit Payment Details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
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
       {/* Pagination controls */}
       <div className="flex items-center justify-end space-x-2 py-4 px-2">
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
}
