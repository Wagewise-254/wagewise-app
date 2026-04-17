import { useState } from 'react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  RefreshCw, 
  Search, 
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  UPDATE: 'bg-blue-50 text-blue-700 border-blue-200',
  DELETE: 'bg-rose-50 text-rose-700 border-rose-200',
  APPROVE: 'bg-purple-50 text-purple-700 border-purple-200',
  LOCK: 'bg-amber-50 text-amber-700 border-amber-200',
  UNLOCK: 'bg-indigo-50 text-indigo-700 border-indigo-200'
};

const ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'LOCK', 'UNLOCK'];

interface AuditLog {
  id: string;
  entity_type: string;
  entity_id: string;
  entity_name: string | null;
  action: string;
  performed_by: string | null;
  created_at: string;
  performer?: {
    full_name: string;
    email: string;
  };
}

interface AuditLogsTableProps {
  logs: AuditLog[];
  loading: boolean;
  pagination: {
    page: number;
    totalPages: number;
    total: number;
  };
  filters: {
    action: string;
    search: string;
  };
  onFilterChange: (key: string, value: string) => void;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
}

export default function AuditLogsTable({
  logs,
  loading,
  pagination,
  filters,
  onFilterChange,
  onPageChange,
  onRefresh,
}: AuditLogsTableProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [showFilter, setShowFilter] = useState(false);

  const formatEntityName = (entityType: string) => {
    return entityType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy HH:mm:ss');
  };

  const startItem = (pagination.page - 1) * 50 + 1;
  const endItem = Math.min(pagination.page * 50, pagination.total);

 return (
  <div className="h-full flex flex-col">
    {/* Header */}
    <div className="shrink-0 flex items-center justify-between gap-4 px-4 pb-0">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold text-slate-900">Audit Logs</h1>
        {/* <Badge variant="outline" className="text-xs">
          {pagination.total} logs
        </Badge> */}
      </div>

      <div className="flex items-center gap-1">
        {/* Filter Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilter(!showFilter)}
              className={cn("h-8 w-8 p-0 cursor-pointer", showFilter && "bg-slate-100")}
            >
              <Filter className="h-4 w-4 text-slate-500" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Filter by action</TooltipContent>
        </Tooltip>

        {/* Search Toggle */}
        <div className="relative">
          {showSearch ? (
            <div className="relative animate-in slide-in-from-left-2 fade-in duration-200">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Search logs..."
                value={filters.search}
                onChange={(e) => onFilterChange('search', e.target.value)}
                onBlur={() => {
                  if (!filters.search) setShowSearch(false);
                }}
                className="pl-8 h-8 w-64 text-sm bg-white border-slate-200 rounded-md focus-visible:ring-1 focus-visible:ring-[#7F5EFD]"
                autoFocus
              />
            </div>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSearch(true)}
                  className="h-8 w-8 p-0 cursor-pointer"
                >
                  <Search className="h-4 w-4 text-slate-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Search logs</TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Refresh Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
              className="h-8 w-8 p-0 cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 text-slate-500 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Refresh logs</TooltipContent>
        </Tooltip>
      </div>
    </div>

    {/* Filter Bar */}
    {showFilter && (
      <div className="shrink-0 px-4 pt-3 animate-in slide-in-from-top-1">
        <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-md border border-slate-200">
          <span className="text-xs text-slate-500 font-medium">Action:</span>
          <Select
            value={filters.action}
            onValueChange={(value) => onFilterChange('action', value)}
          >
            <SelectTrigger className="h-7 w-32 text-xs border-slate-200">
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Actions</SelectItem>
              {ACTIONS.map((action) => (
                <SelectItem key={action} value={action}>
                  {action}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filters.action !== 'ALL' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFilterChange('action', 'ALL')}
              className="h-6 px-2 text-xs"
            >
              Clear
            </Button>
          )}
        </div>
      </div>
    )}

    {/* Table */}
    <div className="flex-1 overflow-hidden mt-4 px-4">
      <div className="h-full flex flex-col space-y-2">
        <div className="flex-1 overflow-auto min-h-0 rounded-sm border border-slate-200">
          <Table className="relative">
            <TableHeader className="sticky top-0 bg-slate-50 z-10 shadow-sm">
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-8 text-xs font-medium text-slate-500">Time</TableHead>
                <TableHead className="h-8 text-xs font-medium text-slate-500">Action</TableHead>
                <TableHead className="h-8 text-xs font-medium text-slate-500">Entity</TableHead>
                <TableHead className="h-8 text-xs font-medium text-slate-500">Performed By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={4} className="py-3">
                      <div className="h-6 bg-slate-100 animate-pulse rounded" />
                    </TableCell>
                  </TableRow>
                ))
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Search className="h-8 w-8 mb-2 opacity-20" />
                      <p className="text-sm">No audit logs found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <TableCell className="py-3">
                      <div className="flex flex-col">
                        <span className="text-sm text-slate-700">
                          {formatDate(log.created_at)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-xs", ACTION_COLORS[log.action])}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-800">
                          {formatEntityName(log.entity_type)}
                        </span>
                        {log.entity_name && (
                          <span className="text-xs text-slate-500">
                            {log.entity_name}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-600">
                        {log.performer?.full_name || log.performer?.email || 'System'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="shrink-0 flex items-center justify-between pt-2">
            <p className="text-xs text-slate-400">
              Showing {startItem} to {endItem} of {pagination.total} results
            </p>
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onPageChange(1)}
                disabled={pagination.page === 1}
                className="h-7 w-7 p-0"
              >
                <ChevronsLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="h-7 w-7 p-0"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs text-slate-600 px-2">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="h-7 w-7 p-0"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onPageChange(pagination.totalPages)}
                disabled={pagination.page === pagination.totalPages}
                className="h-7 w-7 p-0"
              >
                <ChevronsRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);
}