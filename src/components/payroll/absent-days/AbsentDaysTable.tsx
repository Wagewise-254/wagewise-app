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
  Trash2,
  Calendar,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { AbsentDays } from "@/types/absentDays";

// Helper function to get month name
const getMonthName = (month: number) => {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return months[month - 1];
};

interface Props {
  data: AbsentDays[];
  onEdit: (record: AbsentDays) => void;
  onDelete: (record: AbsentDays) => void;
  onBulkDelete: (ids: string[]) => void;
}

const BulkDeleteButton = ({
  table,
  onBulkDeleteClick,
}: {
  table: ReturnType<typeof useReactTable<AbsentDays>>;
  onBulkDeleteClick: (ids: string[]) => void;
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

const AbsentDaysTable: React.FC<Props> = ({
  data,
  onEdit,
  onDelete,
  onBulkDelete,
}) => {
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const columns: ColumnDef<AbsentDays>[] = [
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
      accessorKey: "employees",
      header: "Employee",
      cell: ({ row }) => {
        const employee = row.original.employees;
        return (
          <div>
            <div className="font-medium">
              {employee ? `${employee.first_name} ${employee.last_name}` : "Unknown Employee"}
            </div>
            {employee?.employee_number && (
              <div className="text-xs text-slate-400">{employee.employee_number}</div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "month",
      header: "Month",
      cell: ({ row }) => {
        const month = row.original.month;
        const year = row.original.year;
        return (
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3 text-slate-400" />
            <span>{getMonthName(month)} {year}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "absent_days",
      header: "Absent Days",
      cell: ({ row }) => (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
          {row.original.absent_days} day{row.original.absent_days !== 1 ? 's' : ''}
        </Badge>
      ),
    },
    {
      accessorKey: "total_deduction_amount",
      header: "Deduction Amount",
      cell: ({ row }) => (
        <span className="font-medium text-red-600">
          - {row.original.total_deduction_amount.toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "notes",
      header: "Notes",
      cell: ({ row }) => (
        <span className="text-slate-500 text-sm">
          {row.original.notes || "-"}
        </span>
      ),
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
    globalFilterFn: (row, _columnId, filterValue) => {
      const record = row.original;
      const searchStr = filterValue.toLowerCase();

      // Search by employee name
      if (record.employees) {
        const fullName = `${record.employees.first_name} ${record.employees.last_name}`.toLowerCase();
        if (fullName.includes(searchStr)) return true;
        if (record.employees.employee_number?.toLowerCase().includes(searchStr)) return true;
      }

      // Search by month/year
      const monthYear = `${getMonthName(record.month)} ${record.year}`.toLowerCase();
      if (monthYear.includes(searchStr)) return true;

      // Search by notes
      if (record.notes?.toLowerCase().includes(searchStr)) return true;

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
          placeholder="Search by employee, month, or notes..."
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
                  No absent days records found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
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
    </div>
  );
};

export default AbsentDaysTable;