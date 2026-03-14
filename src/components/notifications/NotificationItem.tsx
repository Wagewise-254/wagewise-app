// src/components/notifications/NotificationItem.tsx
import  { forwardRef } from "react";
import { Check, Trash2, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  is_read: boolean;
  created_at: string;
  type: string;
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  formatTime: (timestamp: string) => string;
  getSeverityColor: (severity: string) => string;
}

const NotificationItem = forwardRef<HTMLDivElement, NotificationItemProps>(
  ({ notification, onMarkAsRead, onDelete, formatTime, getSeverityColor }, ref) => {
    
    const getIcon = () => {
      switch (notification.severity) {
        case 'CRITICAL':
          return <AlertCircle className="h-4 w-4 text-red-500" />;
        case 'WARNING':
          return <AlertTriangle className="h-4 w-4 text-amber-500" />;
        default:
          return <Info className="h-4 w-4 text-blue-500" />;
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          "p-4 hover:bg-slate-50 transition-colors relative group",
          !notification.is_read && "bg-blue-50/30"
        )}
      >
        <div className="flex gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 mt-1">
            {getIcon()}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className={cn(
                "text-sm font-medium text-slate-900",
                !notification.is_read && "font-semibold"
              )}>
                {notification.title}
              </p>
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full border",
                getSeverityColor(notification.severity)
              )}>
                {notification.severity}
              </span>
            </div>
            
            <p className="text-sm text-slate-600 mt-1 line-clamp-2">
              {notification.message}
            </p>
            
            <p className="text-xs text-slate-400 mt-2">
              {formatTime(notification.created_at)}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {!notification.is_read && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 hover:bg-slate-200"
                onClick={() => onMarkAsRead(notification.id)}
                title="Mark as read"
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 hover:bg-slate-200 hover:text-red-600"
              onClick={() => onDelete(notification.id)}
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Unread indicator dot */}
        {!notification.is_read && (
          <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-500" />
        )}
      </div>
    );
  }
);

NotificationItem.displayName = 'NotificationItem';

export default NotificationItem;