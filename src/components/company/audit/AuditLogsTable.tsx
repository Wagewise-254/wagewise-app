// components/company/audit/AuditLogsTable.tsx
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
} from "@/components/ui/pagination";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  RefreshCw, 
  Search, 
  Calendar,
  Filter,
  Eye,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { AuditLog, AuditAction } from '@/types/audit';
import AuditLogDetails from './AuditLogDetails';

const ACTION_COLORS: Record<AuditAction, string> = {
  CREATE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  UPDATE: 'bg-blue-50 text-blue-700 border-blue-200',
  DELETE: 'bg-rose-50 text-rose-700 border-rose-200',
  APPROVE: 'bg-purple-50 text-purple-700 border-purple-200',
  LOCK: 'bg-amber-50 text-amber-700 border-amber-200',
  UNLOCK: 'bg-indigo-50 text-indigo-700 border-indigo-200'
};

interface AuditLogsTableProps {
  logs: AuditLog[];
  loading: boolean;
  pagination: {
    page: number;
    totalPages: number;
    total: number;
  };
  filters: {
    startDate?: string;
    endDate?: string;
    action?: string;
    entityType?: string;
    search?: string;
  };
  onFilterChange: (key: string, value: string) => void;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
  entityTypes: string[];
}

export default function AuditLogsTable({
  logs,
  loading,
  pagination,
  filters,
  onFilterChange,
  onPageChange,
  onRefresh,
  entityTypes
}: AuditLogsTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const formatEntityName = (entityType: string) => {
    return entityType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getActionBadge = (action: AuditAction) => {
    return (
      <Badge variant="outline" className={ACTION_COLORS[action]}>
        {action}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy HH:mm:ss');
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  return (
    <Card className="shadow-none border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-900">
            Audit Logs
          </CardTitle>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className={showFilters ? 'bg-slate-100' : ''}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle filters</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh logs</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4 p-4 bg-slate-50 rounded-lg">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">
                Start Date
              </label>
              <Input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => onFilterChange('startDate', e.target.value)}
                className="h-9"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">
                End Date
              </label>
              <Input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => onFilterChange('endDate', e.target.value)}
                className="h-9"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">
                Action
              </label>
              <Select
                value={filters.action || 'ALL'}
                onValueChange={(value) => onFilterChange('action', value)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Actions</SelectItem>
                  <SelectItem value="CREATE">Create</SelectItem>
                  <SelectItem value="UPDATE">Update</SelectItem>
                  <SelectItem value="DELETE">Delete</SelectItem>
                  <SelectItem value="APPROVE">Approve</SelectItem>
                  <SelectItem value="LOCK">Lock</SelectItem>
                  <SelectItem value="UNLOCK">Unlock</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">
                Entity Type
              </label>
              <Select
                value={filters.entityType || 'ALL'}
                onValueChange={(value) => onFilterChange('entityType', value)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All Entities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Entities</SelectItem>
                  {entityTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {formatEntityName(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search logs..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Performed By</TableHead>
                <TableHead className="text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}>
                      <div className="h-12 bg-slate-100 animate-pulse rounded" />
                    </TableCell>
                  </TableRow>
                ))
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Calendar className="h-10 w-10 mb-2 opacity-20" />
                      <p className="text-sm">No audit logs found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <>
                    <TableRow
                      key={log.id}
                      className="cursor-pointer hover:bg-slate-50"
                      onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                    >
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          {expandedRow === log.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm">
                            {formatDate(log.created_at)}
                          </div>
                          <div className="text-xs text-slate-400">
                            {formatRelativeTime(log.created_at)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm">
                            {formatEntityName(log.entity_type)}
                          </div>
                          <div className="text-xs text-slate-400 font-mono">
                            {log.entity_id.substring(0, 8)}...
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm">
                            {log.performer?.full_name || log.performer?.email || 'System'}
                          </div>
                          {log.performer?.email && (
                            <div className="text-xs text-slate-400">
                              {log.performer.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    {expandedRow === log.id && (
                      <TableRow className="bg-slate-50">
                        <TableCell colSpan={6} className="p-4">
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-4">
                              {log.old_data && (
                                <div>
                                  <h4 className="text-xs font-medium text-slate-500 mb-1">Old Data</h4>
                                  <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-40">
                                    {JSON.stringify(log.old_data, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {log.new_data && (
                                <div>
                                  <h4 className="text-xs font-medium text-slate-500 mb-1">New Data</h4>
                                  <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-40">
                                    {JSON.stringify(log.new_data, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center mt-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => onPageChange(pagination.page - 1)}
                    className={pagination.page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter(page => 
                    page === 1 || 
                    page === pagination.totalPages || 
                    Math.abs(page - pagination.page) <= 2
                  )
                  .map((page, index, array) => {
                    if (index > 0 && array[index - 1] !== page - 1) {
                      return (
                        <PaginationItem key={`ellipsis-${page}`}>
                          <span className="px-4 py-2">...</span>
                        </PaginationItem>
                      );
                    }
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => onPageChange(page)}
                          isActive={pagination.page === page}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => onPageChange(pagination.page + 1)}
                    className={pagination.page >= pagination.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}

        {/* Log Details Dialog */}
        <AuditLogDetails
          log={selectedLog}
          open={!!selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      </CardContent>
    </Card>
  );
}