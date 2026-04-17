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
  ChevronsRight,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
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
          <span className="text-sm font-medium text-slate-800">
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
      return (
        <span className="text-sm font-medium text-slate-800">
          All Employees
        </span>
      );
    case "DEPARTMENT":
      return (
        <span className="text-sm font-medium text-slate-800">
          {allowance.departments?.name || "Unknown Department"}
        </span>
      );
    case "SUB_DEPARTMENT":
      return (
        <span className="text-sm font-medium text-slate-800">
          {allowance.sub_departments?.name || "Unknown Sub-department"}
        </span>
      );
    case "JOB_TITLE":
      return (
        <span className="text-sm font-medium text-slate-800">
          {allowance.job_titles?.title || "Unknown Job Title"}
        </span>
      );
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
  globalSearchValue?: string;
  hideHeader?: boolean;
  readOnly?: boolean;
}

const AllowanceAssignTable: React.FC<Props> = ({
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
          className="shadow-none border-[#7F5EFD] cursor-pointer data-[state=checked]:bg-[#7F5EFD] data-[state=checked]:border-[#7F5EFD]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="shadow-none border-[#7F5EFD] cursor-pointer data-[state=checked]:bg-[#7F5EFD] data-[state=checked]:border-[#7F5EFD]"
          onClick={(e) => e.stopPropagation()}
        />
      ),
      enableSorting: false,
      size: 40,
    },
    {
      accessorKey: "allowance_types.name",
      header: "Allowance Type",
      cell: ({ row }) => {
        const allowanceType = row.original.allowance_types;
        return (
          <div>
            <span className="text-sm font-medium text-slate-800">
              {allowanceType.name}
            </span>
            {!allowanceType.is_cash && (
              <Badge variant="outline" className="ml-2 text-xs">
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
      accessorFn: (row) => getRecipientDisplayString(row),
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
          <span className="font-medium text-slate-700">
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
        const allowance = row.original;
        return (
          <div className="flex items-center gap-1 text-sm text-slate-600">
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
          <span className="text-sm text-slate-400">Ongoing</span>
        ) : (
          <div className="flex items-center gap-1 text-sm text-slate-600">
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
  ];

  // Only add actions column if not readOnly
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
    });
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
      const allowance = row.original;
      const searchStr = filterValue.toLowerCase();

      const recipientDisplay =
        getRecipientDisplayString(allowance).toLowerCase();
      if (recipientDisplay.includes(searchStr)) return true;

      if (allowance.allowance_types.name.toLowerCase().includes(searchStr))
        return true;

      if (allowance.start_month.toLowerCase().includes(searchStr)) return true;
      if (allowance.start_year.toString().includes(searchStr)) return true;
      if (allowance.end_month?.toLowerCase().includes(searchStr)) return true;
      if (allowance.end_year?.toString().includes(searchStr)) return true;

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

  const selectedCount = Object.keys(rowSelection).length;

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
      <div className="flex-1 overflow-auto min-h-0 rounded-sm border border-slate-200 px-1 ">
        <Table className="relative">
          <TableHeader className="sticky top-0 bg-slate-50 z-10 shadow-sm">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className="h-8 text-xs font-medium text-slate-500"
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
                    <p className="text-sm">No allowances found</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {table.getPageCount() > 1 && (
        <div className="shrink-0 flex items-center justify-between pt-2">
          <p className="text-xs text-slate-400">
            Showing {table.getRowModel().rows.length} of {data.length} results
          </p>
          <div className="flex items-center space-x-2">
            <Select
              value={table.getState().pagination.pageSize.toString()}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-7 w-16 text-xs border-slate-200 rounded-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100].map((pageSize) => (
                  <SelectItem key={pageSize} value={pageSize.toString()}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                className="h-7 w-7 p-0"
              >
                <ChevronsLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="h-7 w-7 p-0"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs text-slate-600 px-2">
                Page {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount()}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="h-7 w-7 p-0"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                className="h-7 w-7 p-0"
              >
                <ChevronsRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllowanceAssignTable;
