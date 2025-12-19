import * as React from "react";
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
} from "@/components/ui/pagination";
import { MoreHorizontal } from "lucide-react";
import { EmployeeWithHelb } from "@/components/company/payroll/statutory/HelbStatutorySection";

export type HelbRecord = {
  id: string;
  helb_account_number: string;
  monthly_deduction: number;
  status: string;
};

interface HelbDataTableProps {
  data: EmployeeWithHelb[];
  onEdit: (employee: EmployeeWithHelb) => void;
  onDelete: (employee: EmployeeWithHelb) => void;
}

const HelbDataTable: React.FC<HelbDataTableProps> = ({
  data,
  onEdit,
  onDelete,
}) => {
  const [sorting, setSorting] = React.useState<SortingState>([
    {
      id: "first_name",
      desc: false, // Alphabetical/Ascending
    },
    {
      id: "last_name",
      desc: false, // Secondary sort
    },
  ]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Memoize the columns to prevent unnecessary re-renders
  const columns: ColumnDef<EmployeeWithHelb>[] = React.useMemo(
    () => [
      {
        accessorKey: "first_name",
        header: "First Name",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "last_name",
        header: "Last Name",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "helb_deductions.helb_account_number",
        header: "HELB Account Number",
        cell: (info) => info.getValue() || "N/A",
      },
      {
        accessorKey: "helb_deductions.monthly_deduction",
        header: "Monthly Deduction",
        cell: (info) => {
          const value = info.getValue<number>();
          return value ? `KES ${value.toFixed(2)}` : "N/A";
        },
      },
      {
        accessorKey: "helb_deductions.status",
        header: "Status",
        cell: (info) => info.getValue() || "Not Added",
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const employee = row.original;
          const hasHelbRecord =
            employee.helb_deductions !== null &&
            employee.helb_deductions !== undefined;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {hasHelbRecord ? (
                  <>
                    <DropdownMenuItem
                      onClick={() => onEdit(employee)}
                      className="cursor-pointer"
                    >
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(employee)}
                      className="cursor-pointer"
                    >
                      Delete
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem className="opacity-50" disabled>
                    No HELB Record
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [onEdit, onDelete]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onPaginationChange: setPagination,
    state: {
      sorting,
      pagination,
    },
  });

  return (
    <div className="rounded-md border px-2">
      <Table className="">
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
                No HELB records found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {/* Pagination controls */}
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
    </div>
  );
};

export default HelbDataTable;
