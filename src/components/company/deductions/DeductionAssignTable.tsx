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
import { useState, useEffect } from "react";
import {
  AssignedDeduction,
  getFormattedStartDate,
  getFormattedEndDate,
} from "@/types/deduction";
import { cn } from "@/lib/utils";

// Helper function to get recipient display as string (for filtering/search)
const getRecipientDisplayString = (deduction: AssignedDeduction): string => {
  switch (deduction.applies_to) {
    case "INDIVIDUAL":
      return deduction.employees
        ? `${deduction.employees.first_name} ${deduction.employees.middle_name} ${deduction.employees.last_name} ${deduction.employees.employee_number}`
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

// Helper function to get recipient display as JSX (for rendering)
const getRecipientDisplayElement = (deduction: AssignedDeduction) => {
  switch (deduction.applies_to) {
    case "INDIVIDUAL":
      return deduction.employees ? (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-slate-800">
            {deduction.employees.first_name} {deduction.employees.middle_name}{" "}
            {deduction.employees.last_name}
          </span>
          <span className="text-xs text-slate-400">
            {deduction.employees.employee_number}
          </span>
        </div>
      ) : (
        "Unknown Employee"
      );
    case "COMPANY":
      return <span className="text-sm font-medium text-slate-800">All Employees</span>;
    case "DEPARTMENT":
      return <span className="text-sm font-medium text-slate-800">{deduction.departments?.name || "Unknown Department"}</span>;
    case "SUB_DEPARTMENT":
      return <span className="text-sm font-medium text-slate-800">{deduction.sub_departments?.name || "Unknown Sub-department"}</span>;
    case "JOB_TITLE":
      return <span className="text-sm font-medium text-slate-800">{deduction.job_titles?.title || "Unknown Job Title"}</span>;
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
      return <Building className="h-3 w-3 mr-1 text-slate-400" />;
    case "DEPARTMENT":
    case "SUB_DEPARTMENT":
      return <Users className="h-3 w-3 mr-1 text-slate-400" />;
    case "JOB_TITLE":
      return <Briefcase className="h-3 w-3 mr-1 text-slate-400" />;
    default:
      return null;
  }
};

// Custom sorting function for start date
const dateSort: SortingFn<AssignedDeduction> = (rowA, rowB) => {
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
  data: AssignedDeduction[];
  onEdit: (deduction: AssignedDeduction) => void;
  onDelete: (deduction: AssignedDeduction) => void;
  onBulkDelete: (deductionIds: string[]) => void;
  globalSearchValue?: string;
  hideHeader?: boolean;
  readOnly?: boolean;
}

const DeductionAssignTable: React.FC<Props> = ({
  data,
  onEdit,
  onDelete,
  onBulkDelete,
  globalSearchValue = "",
  readOnly = false,
}) => {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [globalFilter, setGlobalFilter] = useState("");

  // Sync external search
  useEffect(() => {
    setGlobalFilter(globalSearchValue);
  }, [globalSearchValue]);

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
          className="shadow-none cursor-pointer data-[state=checked]:bg-[#1F3A8A] data-[state=checked]:border-[#1F3A8A]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="shadow-none cursor-pointer data-[state=checked]:bg-[#1F3A8A] data-[state=checked]:border-[#1F3A8A]"
          onClick={(e) => e.stopPropagation()}
        />
      ),
      enableSorting: false,
      size: 40,
    },
    {
      accessorKey: "deduction_types.name",
      header: "Deduction Type",
      cell: ({ row }) => {
        const deductionType = row.original.deduction_types;
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-800">{deductionType.name}</span>
            {deductionType.is_pre_tax && (
              <Badge variant="secondary" className="text-xs">
                Pre-tax
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      id: "recipient",
      header: "Recipient",
      accessorFn: (row) => getRecipientDisplayString(row),
      cell: ({ row }) => {
        const deduction = row.original;
        const icon = getRecipientIcon(deduction.applies_to);
        const display = getRecipientDisplayElement(deduction);

        return (
          <div className="flex items-start gap-1">
            <div className="mt-0.5">{icon}</div>
            <div>
              {display}
              {deduction.applies_to !== "INDIVIDUAL" &&
                deduction.applies_to !== "COMPANY" && (
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {deduction.applies_to.replace("_", " ")}
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
        const deduction = row.original;
        return (
          <span className="font-medium text-slate-700">
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
        <Badge variant="outline" className="text-xs">
          {row.original.calculation_type === "FIXED" ? "Fixed" : "Percentage"}
        </Badge>
      ),
    },
    {
      accessorKey: "is_recurring",
      header: "Recurring",
      cell: ({ row }) =>
        row.original.is_recurring ? (
          <Check className="h-4 w-4 text-emerald-500" />
        ) : (
          <X className="h-4 w-4 text-slate-400" />
        ),
    },
    {
      id: "start_date",
      header: "Start Date",
      accessorFn: (row) => `${row.start_month} ${row.start_year}`,
      cell: ({ row }) => {
        const deduction = row.original;
        return (
          <div className="flex items-center gap-1 text-sm text-slate-600">
            <Calendar className="h-3 w-3 text-slate-400" />
            <span>{getFormattedStartDate(deduction)}</span>
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
        const deduction = row.original;
        const endDate = getFormattedEndDate(deduction);
        return endDate === "Ongoing" ? (
          <span className="text-sm text-slate-400">Ongoing</span>
        ) : (
          <div className="flex items-center gap-1 text-sm text-slate-600">
            <Calendar className="h-3 w-3 text-slate-400" />
            <span>{endDate}</span>
          </div>
        );
      },
    },
  ];

  if (!readOnly) {
    columns.push({
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-7 w-7 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-3.5 w-3.5 text-slate-400" />
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
        </div>
      ),
    })
  }


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
      if (deduction.deduction_types.name.toLowerCase().includes(searchStr))
        return true;

      // Search by recipient
      const recipientDisplay = getRecipientDisplayString(deduction).toLowerCase();
      if (recipientDisplay.includes(searchStr)) return true;

      // Search by month/year
      if (deduction.start_month.toLowerCase().includes(searchStr)) return true;
      if (deduction.start_year.toString().includes(searchStr)) return true;
      if (deduction.end_month?.toLowerCase().includes(searchStr)) return true;
      if (deduction.end_year?.toString().includes(searchStr)) return true;

      return false;
    },
    onGlobalFilterChange: setGlobalFilter,
    state: {
      globalFilter,
      rowSelection,
      pagination,
    },
  });

  const selectedCount = Object.keys(rowSelection).length;

  const renderPaginationItems = () => {
    const pageCount = table.getPageCount();
    const currentPage = table.getState().pagination.pageIndex;
    const items = [];

    if (pageCount <= 5) {
      for (let i = 0; i < pageCount; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              isActive={currentPage === i}
              onClick={() => table.setPageIndex(i)}
              className="cursor-pointer h-7 w-7"
            >
              {i + 1}
            </PaginationLink>
          </PaginationItem>,
        );
      }
    } else {
      items.push(
        <PaginationItem key={0}>
          <PaginationLink
            isActive={currentPage === 0}
            onClick={() => table.setPageIndex(0)}
            className="cursor-pointer h-7 w-7"
          >
            1
          </PaginationLink>
        </PaginationItem>,
      );

      if (currentPage > 2) {
        items.push(<PaginationEllipsis key="ellipsis-1" />);
      }

      const start = Math.max(1, currentPage - 1);
      const end = Math.min(pageCount - 2, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (i > 0 && i < pageCount - 1) {
          items.push(
            <PaginationItem key={i}>
              <PaginationLink
                isActive={currentPage === i}
                onClick={() => table.setPageIndex(i)}
                className="cursor-pointer h-7 w-7"
              >
                {i + 1}
              </PaginationLink>
            </PaginationItem>,
          );
        }
      }

      if (currentPage < pageCount - 3) {
        items.push(<PaginationEllipsis key="ellipsis-2" />);
      }

      items.push(
        <PaginationItem key={pageCount - 1}>
          <PaginationLink
            isActive={currentPage === pageCount - 1}
            onClick={() => table.setPageIndex(pageCount - 1)}
            className="cursor-pointer h-7 w-7"
          >
            {pageCount}
          </PaginationLink>
        </PaginationItem>,
      );
    }

    return items;
  };

  return (
    <div className="h-full flex flex-col space-y-2">
      {/* Bulk Actions Bar */}
      {selectedCount > 0 && (
        <div className="shrink-0 flex items-center justify-between animate-in fade-in slide-in-from-top-1">
          <span className="text-xs font-medium text-slate-500">
            {selectedCount} selected
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs border-rose-200 text-rose-600 hover:bg-rose-50"
              onClick={() => {
                const selectedIds = table
                  .getSelectedRowModel()
                  .rows.map((row) => row.original.id);
                onBulkDelete(selectedIds);
              }}
            >
              <Trash2 className="mr-1 h-3 w-3" />
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="flex-1 overflow-auto min-h-0 rounded-sm border border-slate-200 px-2 ">
        <Table className="relative">
          <TableHeader className="sticky top-0  z-10 shadow-sm">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className="h-10 text-xs font-medium text-slate-500"
                  >
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
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-2">
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
                  className="h-32 text-center"
                >
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <p className="text-sm">No deductions found</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {table.getPageCount() > 1 && (
        <div className="shrink-0 flex items-center justify-between pt-1">
          <p className="text-xs text-slate-400">
            Showing {table.getRowModel().rows.length} of {data.length}
          </p>
          <div className="flex items-center space-x-2">
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-7 w-16 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 30, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Pagination className="w-auto">
              <PaginationContent className="gap-0.5">
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => table.previousPage()}
                    className={cn(
                      "h-7 w-7 p-0",
                      !table.getCanPreviousPage() &&
                        "pointer-events-none opacity-50",
                    )}
                  />
                </PaginationItem>

                {renderPaginationItems()}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => table.nextPage()}
                    className={cn(
                      "h-7 w-7 p-0",
                      !table.getCanNextPage() &&
                        "pointer-events-none opacity-50",
                    )}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeductionAssignTable;