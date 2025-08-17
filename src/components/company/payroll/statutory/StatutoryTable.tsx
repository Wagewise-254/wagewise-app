// src/components/company/payroll/StatutoryTable.tsx
import * as React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  ColumnDef,
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
import { MoreHorizontal, Check, X } from "lucide-react";
import { Employee } from "@/types/statutory"; // Assuming this type is in a central file
import { Input } from "@/components/ui/input";

interface StatutoryTableProps {
  data: Employee[];
  onEdit: (employee: Employee) => void;
}

export function StatutoryTable({ data, onEdit }: StatutoryTableProps) {
  const [globalFilter, setGlobalFilter] = React.useState("");

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
      accessorKey: "pays_paye",
      header: "PAYE",
      cell: ({ row }) => (
        row.original.pays_paye ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />
      ),
    },
    {
      accessorKey: "pays_nssf",
      header: "NSSF",
      cell: ({ row }) => (
        row.original.pays_nssf ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />
      ),
    },
    {
      accessorKey: "pays_housing_levy",
      header: "Housing Levy",
      cell: ({ row }) => (
        row.original.pays_housing_levy ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />
      ),
    },
    {
      accessorKey: "pays_helb",
      header: "HELB",
      cell: ({ row }) => (
        row.original.pays_helb ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />
      ),
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
                Edit Statutory Details
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
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  return (
    <div className="rounded-md border px-2">
      <div className="flex items-center py-4">
        <Input
          placeholder="Search employees by Employee No..."
          value={globalFilter ?? ''}
          onChange={(event) => setGlobalFilter(String(event.target.value))}
          className="max-w-sm"
        />
      </div>
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