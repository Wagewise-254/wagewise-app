import { useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  SortingState,
  TableOptions,
  RowSelectionState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Loader2, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Define a minimal interface for rows that can be selected
interface SelectableRow {
  id?: string;
  reviewId?: string;
  employeeId?: string;
}

interface PayrollReportTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  loading?: boolean;
  options?: Partial<TableOptions<TData>>;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: (updater: React.SetStateAction<RowSelectionState>) => void;
  pageSizeOptions?: number[];
}

export function PayrollReportTable<TData extends SelectableRow, TValue>({
  columns,
  data,
  loading = false,
  options = {},
  rowSelection,
  onRowSelectionChange,
  pageSizeOptions = [10, 25, 50, 100],
}: PayrollReportTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [internalRowSelection, setInternalRowSelection] = useState<RowSelectionState>({});
  const [pageSize, setPageSize] = useState(pageSizeOptions[0]);

  const hasRowSelection = rowSelection !== undefined && onRowSelectionChange !== undefined;
  const currentRowSelection = hasRowSelection ? rowSelection : internalRowSelection;
  const handleRowSelectionChange = hasRowSelection ? onRowSelectionChange : setInternalRowSelection;

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection: hasRowSelection,
    onRowSelectionChange: handleRowSelectionChange,
    getRowId: (row: TData) => row.id || row.reviewId || row.employeeId || crypto.randomUUID(),
    ...options,
    state: {
      sorting,
      globalFilter,
      rowSelection: currentRowSelection,
      pagination: {
        pageIndex: 0,
        pageSize,
      },
      ...options.state,
    },
  });

  // Get all filtered row IDs for "select all across pages"
  const allFilteredRowIds = table.getFilteredRowModel().rows.map(row => row.id);
  const allFilteredRowsSelected = allFilteredRowIds.length > 0 && 
    allFilteredRowIds.every(id => currentRowSelection[id]);

  // Handle select all across all pages
  const handleSelectAllAcrossPages = () => {
    if (allFilteredRowsSelected) {
      // Deselect all
      const newSelection = { ...currentRowSelection };
      allFilteredRowIds.forEach(id => {
        delete newSelection[id];
      });
      handleRowSelectionChange(newSelection);
    } else {
      // Select all
      const newSelection = { ...currentRowSelection };
      allFilteredRowIds.forEach(id => {
        newSelection[id] = true;
      });
      handleRowSelectionChange(newSelection);
    }
  };

  const selectedCount = Object.keys(currentRowSelection).length;

  return (
    <div className="space-y-4">
      {/* Search and Controls */}
      <div className="flex items-center justify-between px-4 pt-4">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search employees..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="pl-8 h-8 text-sm border-slate-200 bg-slate-50/50 focus:bg-white rounded-sm shadow-none"
          />
        </div>
        
        <div className="flex items-center gap-4">
          {/* Selection info */}
          {hasRowSelection && selectedCount > 0 && (
            <div className="text-xs text-indigo-600 font-medium">
              {selectedCount} selected
              {selectedCount < allFilteredRowIds.length && (
                <span className="text-slate-400 ml-1">
                  (of {allFilteredRowIds.length})
                </span>
              )}
            </div>
          )}
          
          {/* Page size selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Show</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => setPageSize(Number(value))}
            >
              <SelectTrigger className="h-8 w-16 text-xs border-slate-200 bg-slate-50/50 rounded-sm shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map(size => (
                  <SelectItem key={size} value={size.toString()} className="text-xs">
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-slate-500">entries</span>
          </div>
        </div>
      </div>

      {/* Bulk Select All Across Pages Banner */}
      {hasRowSelection && allFilteredRowIds.length > 0 && (
        <div className="px-4">
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-sm px-3 py-2">
            <div className="flex items-center gap-2">
              <div className="text-xs text-slate-600">
                {selectedCount === allFilteredRowIds.length ? (
                  <span className="font-medium text-indigo-600">
                    All {allFilteredRowIds.length} employees selected
                  </span>
                ) : selectedCount > 0 ? (
                  <span>
                    <span className="font-medium">{selectedCount}</span> employees selected on this page
                  </span>
                ) : (
                  <span>No employees selected</span>
                )}
              </div>
            </div>
            
            {selectedCount !== allFilteredRowIds.length && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAllAcrossPages}
                className="h-7 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
              >
                Select all {allFilteredRowIds.length} employees
              </Button>
            )}
            
            {selectedCount === allFilteredRowIds.length && selectedCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAllAcrossPages}
                className="h-7 text-xs text-slate-600 hover:text-slate-700 hover:bg-slate-100"
              >
                Clear selection
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b border-slate-100 hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead 
                    key={header.id} 
                    className="text-xs font-medium text-slate-500 py-3 px-4 h-9"
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={cn(
                          "flex items-center gap-1",
                          header.column.getCanSort() && "cursor-pointer select-none"
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() && (
                          <ChevronDown className={cn(
                            "h-3 w-3 transition-transform",
                            header.column.getIsSorted() === "asc" && "rotate-180"
                          )} />
                        )}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-40 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-slate-300" />
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow 
                  key={row.id} 
                  className={cn(
                    "border-b border-slate-50 hover:bg-slate-50/50 transition-colors",
                    row.getIsSelected() && "bg-indigo-50/30"
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-2.5 px-4 text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-40 text-center text-sm text-slate-500">
                  No results found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Enhanced Pagination */}
      <div className="flex items-center justify-between px-4 pb-4">
        <div className="text-xs text-slate-500">
          Showing {table.getState().pagination.pageIndex * pageSize + 1} to{" "}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * pageSize,
            table.getFilteredRowModel().rows.length
          )}{" "}
          of {table.getFilteredRowModel().rows.length} results
        </div>
        
        <div className="flex items-center gap-2">
          {/* First page button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="h-7 w-7 p-0 text-xs"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          
          {/* Previous page button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-7 w-7 p-0 text-xs"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          {/* Page numbers */}
          <div className="flex items-center gap-1">
            {Array.from({ length: table.getPageCount() }, (_, i) => i + 1)
              .filter(page => {
                const currentPage = table.getState().pagination.pageIndex + 1;
                return page === 1 || page === table.getPageCount() || Math.abs(page - currentPage) <= 1;
              })
              .map((page, index, array) => {
                if (index > 0 && array[index - 1] !== page - 1) {
                  return (
                    <div key={`ellipsis-${page}`} className="px-1 text-xs text-slate-400">
                      ...
                    </div>
                  );
                }
                return (
                  <Button
                    key={page}
                    variant={table.getState().pagination.pageIndex + 1 === page ? "default" : "ghost"}
                    size="sm"
                    onClick={() => table.setPageIndex(page - 1)}
                    className={cn(
                      "h-7 w-7 p-0 text-xs",
                      table.getState().pagination.pageIndex + 1 === page
                        ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                        : "text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    {page}
                  </Button>
                );
              })}
          </div>
          
          {/* Next page button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="h-7 w-7 p-0 text-xs"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          {/* Last page button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="h-7 w-7 p-0 text-xs"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}