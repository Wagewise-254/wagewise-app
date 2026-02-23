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
import { MoreHorizontal, AlertCircle } from "lucide-react";
import { EmployeeWithHelb } from "@/pages/company/payroll/deductions/HELBSection";
import { Badge } from "@/components/ui/badge";

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
      id: "name", // Changed to match the column id
      desc: false,
    },
  ]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Safe getter for HELB data
  const getHelbData = (employee: EmployeeWithHelb) => {
    return employee.helb_accounts || null;
  };

    const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Memoize the columns to prevent unnecessary re-renders
  const columns: ColumnDef<EmployeeWithHelb>[] = React.useMemo(
    () => [
      {
        id: "name",
        header: "Full Names",
        accessorFn: (row) => `${row.first_name} ${row.last_name}`, // For sorting
        cell: ({ row }) => {
          const emp = row.original;
          return (
            <div className="flex flex-col py-1">
              <span className="font-semibold text-slate-800">{`${emp.first_name} ${emp.last_name}`}</span>
              <span className="text-[11px] text-slate-400 tracking-tight">
                {emp.employee_number}
              </span>
              <span className="text-[11px] text-slate-400">
                {emp.job_titles?.title || "Staff"}
              </span>
            </div>
          );
        },
      },
      {
        id: "department",
        header: "Department",
        accessorFn: (row) => row.departments?.name || "N/A",
        cell: ({ row }) => (
          <span className="text-slate-600">
            {row.original.departments?.name || "N/A"}
          </span>
        ),
      },
      {
        id: "helb_account",
        header: "HELB Account",
        accessorFn: (row) => row.helb_accounts?.helb_account_number || "",
        cell: ({ row }) => {
          const helb = getHelbData(row.original);
          return (
            <span className={helb ? "text-slate-800" : "text-slate-400"}>
              {helb?.helb_account_number || "—"}
            </span>
          );
        },
      },
      {
        id: "monthly_deduction",
        header: "Monthly Deduction",
        accessorFn: (row) => row.helb_accounts?.monthly_deduction || 0,
        cell: ({ row }) => {
          const helb = getHelbData(row.original);
          return (
            <span className={helb ? "text-rose-600 font-medium" : "text-slate-400"}>
              {helb ? `- ${formatCurrency(helb.monthly_deduction)}` : "—"}
            </span>
          );
        },
      },
      {
        id: "start_date",
        header: "Start Date",
        accessorFn: (row) => row.helb_accounts?.start_date || "",
        cell: ({ row }) => {
          const helb = getHelbData(row.original);
          return (
            <span className={helb ? "text-sm text-slate-600" : "text-slate-400"}>
              {helb?.start_date
                ? new Date(helb.start_date).toLocaleDateString("en-KE", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : "—"}
            </span>
          );
        },
      },
      {
        id: "status",
        header: "Status",
        accessorFn: (row) => row.helb_accounts?.status || "Not Added",
        cell: ({ row }) => {
          const helb = getHelbData(row.original);
          const status = helb?.status;

          if (!status) {
            return (
              <Badge
                variant="outline"
                className="bg-slate-50 text-slate-400 border-slate-200"
              >
                Not Added
              </Badge>
            );
          }

          return (
            <Badge
              className={
                status === "ACTIVE"
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-yellow-50 text-yellow-700 border-yellow-200"
              }
              variant="outline"
            >
              {status}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const employee = row.original;
          const hasHelbRecord =
            employee.helb_accounts !== null &&
            employee.helb_accounts !== undefined;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-sm">
                {hasHelbRecord ? (
                  <>
                    <DropdownMenuItem
                      onClick={() => onEdit(employee)}
                      className="cursor-pointer"
                    >
                      Edit HELB Record
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(employee)}
                      className="cursor-pointer text-red-600"
                    >
                      Delete Record
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem
                    className="opacity-50 cursor-not-allowed"
                    disabled
                  >
                    No HELB Record
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [onEdit, onDelete],
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

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-slate-300 rounded-sm">
        <AlertCircle className="h-12 w-12 text-slate-300 mb-4" />
        <p className="text-slate-500 text-center">
          No HELB records found. Click the "Add HELB Record" button to create
          one.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mb-4">
      <div className="rounded-sm border border-slate-200 overflow-hidden  px-2">
        <Table>
          <TableHeader className="bg-slate-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-slate-50">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-xs font-semibold text-slate-600 uppercase tracking-wider py-3"
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={
                          header.column.getCanSort()
                            ? "cursor-pointer select-none flex items-center gap-1 hover:text-slate-900"
                            : ""
                        }
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {{
                          asc: <span className="text-xs"> ↑</span>,
                          desc: <span className="text-xs"> ↓</span>,
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
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
                  className="hover:bg-slate-50/50 border-b border-slate-100"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
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
                  className="h-24 text-center text-slate-500"
                >
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination controls */}
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-xs text-slate-500">
            Showing{" "}
            {table.getState().pagination.pageIndex *
              table.getState().pagination.pageSize +
              1}{" "}
            to{" "}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) *
                table.getState().pagination.pageSize,
              data.length,
            )}{" "}
            of {data.length} entries
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => table.previousPage()}
                  className={
                    !table.getCanPreviousPage()
                      ? "cursor-not-allowed opacity-50"
                      : "cursor-pointer hover:bg-slate-100"
                  }
                />
              </PaginationItem>
              {Array.from({ length: table.getPageCount() }, (_, index) => {
                // Show limited page numbers
                if (
                  index === 0 ||
                  index === table.getPageCount() - 1 ||
                  (index >= table.getState().pagination.pageIndex - 1 &&
                    index <= table.getState().pagination.pageIndex + 1)
                ) {
                  return (
                    <PaginationItem key={index}>
                      <PaginationLink
                        isActive={
                          table.getState().pagination.pageIndex === index
                        }
                        onClick={() => table.setPageIndex(index)}
                        className="cursor-pointer rounded-sm"
                      >
                        {index + 1}
                      </PaginationLink>
                    </PaginationItem>
                  );
                } else if (
                  index === table.getState().pagination.pageIndex - 2 ||
                  index === table.getState().pagination.pageIndex + 2
                ) {
                  return (
                    <PaginationItem key={index}>
                      <span className="px-2">...</span>
                    </PaginationItem>
                  );
                }
                return null;
              })}
              <PaginationItem>
                <PaginationNext
                  onClick={() => table.nextPage()}
                  className={
                    !table.getCanNextPage()
                      ? "cursor-not-allowed opacity-50"
                      : "cursor-pointer hover:bg-slate-100"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default HelbDataTable;
