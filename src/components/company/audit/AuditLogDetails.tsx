// components/company/audit/AuditLogDetails.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { AuditLog } from "@/types/audit";

interface AuditLogDetailsProps {
  log: AuditLog | null;
  open: boolean;
  onClose: () => void;
}

export default function AuditLogDetails({ log, open, onClose }: AuditLogDetailsProps) {
  if (!log) return null;

  const formatEntityName = (entityType: string) => {
    return entityType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getActionColor = (action: string) => {
    const colors = {
      CREATE: 'bg-emerald-100 text-emerald-800',
      UPDATE: 'bg-blue-100 text-blue-800',
      DELETE: 'bg-rose-100 text-rose-800',
      APPROVE: 'bg-purple-100 text-purple-800',
      LOCK: 'bg-amber-100 text-amber-800',
      UNLOCK: 'bg-indigo-100 text-indigo-800'
    };
    return colors[action as keyof typeof colors] || 'bg-slate-100 text-slate-800';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Audit Log Details
            <Badge className={getActionColor(log.action)}>
              {log.action}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="text-xs font-medium text-slate-500">Timestamp</p>
              <p className="text-sm">{format(new Date(log.created_at), 'PPP p')}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Entity Type</p>
              <p className="text-sm">{formatEntityName(log.entity_type)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Entity ID</p>
              <p className="text-sm font-mono">{log.entity_id}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Performed By</p>
              <p className="text-sm">
                {log.performer?.full_name || log.performer?.email || 'System'}
              </p>
            </div>
          </div>

          {/* Data Changes */}
          <div className="grid grid-cols-2 gap-4">
            {log.old_data && (
              <div>
                <h3 className="text-sm font-medium text-slate-700 mb-2">Previous Data</h3>
                <pre className="text-xs bg-slate-50 p-3 rounded-lg border overflow-auto max-h-60">
                  {JSON.stringify(log.old_data, null, 2)}
                </pre>
              </div>
            )}
            {log.new_data && (
              <div>
                <h3 className="text-sm font-medium text-slate-700 mb-2">New Data</h3>
                <pre className="text-xs bg-slate-50 p-3 rounded-lg border overflow-auto max-h-60">
                  {JSON.stringify(log.new_data, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* If no data changes */}
          {!log.old_data && !log.new_data && (
            <div className="text-center py-8 text-slate-400">
              No detailed data available for this log entry
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}