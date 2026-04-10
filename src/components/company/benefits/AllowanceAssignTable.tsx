// src/components/company/payroll/allowances/AllowanceAssignTable.tsx

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
import {
  MoreHorizontal,
  Check,
  X,
  Trash2,
  Building,
  Users,
  Briefcase,
  Calendar,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import {
  Allowance,
  getFormattedEndDate,
  getFormattedStartDate,
  HousingMetadata,
  CarMetadata,
} from "@/types/allowance";

// Helper function to get recipient display as string (for filtering/search)
const getRecipientDisplayString = (allowance: Allowance): string => {
  switch (allowance.applies_to) {
    case "INDIVIDUAL":
      return allowance.employees
        ? `${allowance.employees.first_name} ${allowance.employees.middle_name} ${allowance.employees.last_name} ${allowance.employees.employee_number}`
        : "Unknown Employee";
    case "COMPANY":
      return "All Employees";
    case "DEPARTMENT":
      return allowance.departments?.name || "Unknown Department";
    case "SUB_DEPARTMENT":
      return allowance.sub_departments?.name || "Unknown Sub-department";
    case "JOB_TITLE":
      return allowance.job_titles?.title || "Unknown Job Title";
    default:
      return "N/A";
  }
};

// Helper function to get recipient display as JSX (for rendering)
const getRecipientDisplayElement = (allowance: Allowance) => {
  switch (allowance.applies_to) {
    case "INDIVIDUAL":
      return allowance.employees ? (
        <div className="flex flex-col">
          <span>
            {allowance.employees.first_name} {allowance.employees.middle_name}{" "}
            {allowance.employees.last_name}
          </span>
          <span className="text-xs text-slate-400">
            {allowance.employees.employee_number}
          </span>
        </div>
      ) : (
        "Unknown Employee"
      );
    case "COMPANY":
      return "All Employees";
    case "DEPARTMENT":
      return allowance.departments?.name || "Unknown Department";
    case "SUB_DEPARTMENT":
      return allowance.sub_departments?.name || "Unknown Sub-department";
    case "JOB_TITLE":
      return allowance.job_titles?.title || "Unknown Job Title";
    default:
      return "N/A";
  }
};

// Add this helper function to generate page numbers with ellipsis
const getPageNumbers = (
  currentPage: number,
  totalPages: number,
): (number | string)[] => {
  const delta = 2; // Number of pages to show on each side of current page
  const range: number[] = [];
  const rangeWithDots: (number | string)[] = [];
  let l: number | undefined;

  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - delta && i <= currentPage + delta)
    ) {
      range.push(i);
    }
  }

  range.forEach((i) => {
    if (l) {
      if (i - l === 2) {
        rangeWithDots.push(l + 1);
      } else if (i - l !== 1) {
        rangeWithDots.push("...");
      }
    }
    rangeWithDots.push(i);
    l = i;
  });

  return rangeWithDots;
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

// Custom sorting function for start date (month/year)
const dateSort: SortingFn<Allowance> = (rowA, rowB) => {
  const aYear = rowA.original.start_year;
  const bYear = rowB.original.start_year;
  if (aYear !== bYear) return aYear - bYear;

  const monthOrder: Record<string, number> = {
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

  return (
    monthOrder[rowA.original.start_month] -
    monthOrder[rowB.original.start_month]
  );
};

interface Props {
  data: Allowance[];
  onEdit: (allowance: Allowance) => void;
  onDelete: (allowance: Allowance) => void;
  onBulkDelete: (allowanceIds: string[]) => void;
}

const BulkDeleteButton = ({
  table,
  onBulkDeleteClick,
}: {
  table: ReturnType<typeof useReactTable<Allowance>>;
  onBulkDeleteClick: (allowanceIds: string[]) => void;
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

const AllowanceAssignTable: React.FC<Props> = ({
  data,
  onEdit,
  onDelete,
  onBulkDelete,
}) => {
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 20,
  });

  const columns: ColumnDef<Allowance>[] = [
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
      accessorKey: "allowance_types.name",
      header: "Allowance Type",
      cell: ({ row }) => {
        const allowanceType = row.original.allowance_types;
        return (
          <div>
            <div>{allowanceType.name}</div>
            {!allowanceType.is_cash && (
              <Badge variant="outline" className="mt-1 text-xs">
                Non-Cash
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      id: "recipient",
      header: "Recipient",
      accessorFn: (row) => getRecipientDisplayString(row), // For filtering/sorting
      cell: ({ row }) => {
        const allowance = row.original;
        const icon = getRecipientIcon(allowance.applies_to);
        const display = getRecipientDisplayElement(allowance);

        return (
          <div className="flex items-start gap-1">
            <div className="mt-0.5">{icon}</div>
            <div>
              {display}
              {allowance.applies_to !== "INDIVIDUAL" &&
                allowance.applies_to !== "COMPANY" && (
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {allowance.applies_to.replace("_", " ")}
                  </Badge>
                )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "value",
      header: "Value",
      cell: ({ row }) => {
        const allowance = row.original;
        return (
          <span className="font-medium">
            {allowance.value.toLocaleString()}
            {allowance.calculation_type === "PERCENTAGE" ? "%" : ""}
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
      id: "start_date",
      header: "Start Date",
      accessorFn: (row) => `${row.start_month} ${row.start_year}`,
      cell: ({ row }) => {
        const allowance = row.original;
        return (
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3 text-slate-400" />
            <span>{getFormattedStartDate(allowance)}</span>
          </div>
        );
      },
      sortingFn: dateSort,
    },
    {
      id: "end_date",
      header: "End Date",
      accessorFn: (row) => {
        if (row.is_recurring && !row.end_month) return "Ongoing";
        return row.end_month ? `${row.end_month} ${row.end_year}` : "Ongoing";
      },
      cell: ({ row }) => {
        const allowance = row.original;
        const endDate = getFormattedEndDate(allowance);
        return endDate === "Ongoing" ? (
          <span className="text-muted-foreground">Ongoing</span>
        ) : (
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3 text-slate-400" />
            <span>{endDate}</span>
          </div>
        );
      },
    },
    {
      id: "metadata",
      header: "Details",
      cell: ({ row }) => {
        const allowance = row.original;
        const metadata = allowance.metadata;

        if (allowance.allowance_types.code === "HOUSING") {
          const housingMetadata = metadata as HousingMetadata;
          if (housingMetadata.type) {
            return (
              <Badge variant="secondary" className="text-xs">
                {housingMetadata.type === "ordinary"
                  ? "Ordinary"
                  : housingMetadata.type === "farm"
                    ? "Farm"
                    : "Service Director"}
              </Badge>
            );
          }
        }

        if (allowance.allowance_types.code === "CAR") {
          const carMetadata = metadata as CarMetadata;
          if (carMetadata.engine_cc) {
            return (
              <Badge variant="secondary" className="text-xs">
                {carMetadata.engine_cc}cc
              </Badge>
            );
          }
        }

        return null;
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
      const allowance = row.original;
      const searchStr = filterValue.toLowerCase();

      // Search by recipient name (using string version)
      const recipientDisplay =
        getRecipientDisplayString(allowance).toLowerCase();
      if (recipientDisplay.includes(searchStr)) return true;

      // Search by allowance type
      if (allowance.allowance_types.name.toLowerCase().includes(searchStr))
        return true;

      // Search by month/year
      if (allowance.start_month.toLowerCase().includes(searchStr)) return true;
      if (allowance.start_year.toString().includes(searchStr)) return true;
      if (allowance.end_month?.toLowerCase().includes(searchStr)) return true;
      if (allowance.end_year?.toString().includes(searchStr)) return true;

      // Search by metadata
      if (allowance.allowance_types.code === "HOUSING") {
        const housingMetadata = allowance.metadata as HousingMetadata;
        if (housingMetadata.type?.toLowerCase().includes(searchStr))
          return true;
      }

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
          placeholder="Search by employee, allowance type, month, or details..."
          value={globalFilter ?? ""}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="max-w-sm rounded-sm shadow-none"
        />
        <BulkDeleteButton table={table} onBulkDeleteClick={onBulkDelete} />
      </div>

      <div className="rounded-sm shadow-none px-2 border border-slate-300">
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
                          header.getContext(),
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
                  className="h-24 text-center"
                >
                  No allowances found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>

        <div className="flex items-center space-x-4">
          {/* Rows per page selector */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-slate-600">Show</span>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-8 w-17.5">
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 30, 50, 100].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Shadcn Pagination */}
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    table.previousPage();
                  }}
                  className={
                    !table.getCanPreviousPage()
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
              </PaginationItem>

              {getPageNumbers(
                table.getState().pagination.pageIndex + 1,
                table.getPageCount(),
              ).map((page, i) => (
                <PaginationItem key={i}>
                  {page === "..." ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        table.setPageIndex(Number(page) - 1);
                      }}
                      isActive={
                        table.getState().pagination.pageIndex + 1 === page
                      }
                    >
                      {page}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    table.nextPage();
                  }}
                  className={
                    !table.getCanNextPage()
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>

          {/* Page indicator */}
          <span className="text-sm text-slate-600">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AllowanceAssignTable;
