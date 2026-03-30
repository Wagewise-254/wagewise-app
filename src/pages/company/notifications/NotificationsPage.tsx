// src/pages/company/notifications/NotificationsPage.tsx

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { API_BASE_URL } from "@/config";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  CheckCheck,
  Trash2,
  Archive,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  AlertTriangle,
  Info,
  Calendar,
  Loader2,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationMetadata {
  [key: string]: string | number | boolean | null | undefined;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  is_read: boolean;
  is_archived: boolean;
  created_at: string;
  entity_type?: string;
  entity_id?: string;
  metadata?: NotificationMetadata;
}

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { session } = useAuthStore();
  const token = session?.access_token;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "archived">("all");
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const itemsPerPage = 20;

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });

      if (activeTab === "unread") {
        params.append("unread_only", "true");
      } else if (activeTab === "archived") {
        params.append("archived", "true");
      }

      if (searchTerm) {
        params.append("search", searchTerm);
      }
      if (severityFilter !== "all") {
        params.append("severity", severityFilter);
      }
      if (typeFilter !== "all") {
        params.append("type", typeFilter);
      }

      const response = await fetch(`${API_BASE_URL}/notifications?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch notifications");

      const data = await response.json();
      setNotifications(data.notifications);
      setTotalPages(data.totalPages || Math.ceil(data.total / itemsPerPage));
      setTotalCount(data.total);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, activeTab, searchTerm, severityFilter, typeFilter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Mark single notification as read
  const markAsRead = async (notificationId: string) => {
    if (!token) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/notifications/${notificationId}/read`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error("Failed to mark as read");

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      toast.success("Marked as read");
    } catch (error) {
      console.error("Error marking as read:", error);
      toast.error("Failed to mark as read");
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to mark all as read");

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast.error("Failed to mark all as read");
    }
  };

  // Archive notification
  const archiveNotification = async (notificationId: string) => {
    if (!token) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/notifications/${notificationId}/archive`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error("Failed to archive notification");

      if (activeTab === "archived") {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      } else {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, is_archived: true } : n
          )
        );
      }
      toast.success("Notification archived");
    } catch (error) {
      console.error("Error archiving notification:", error);
      toast.error("Failed to archive notification");
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    if (!token) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/notifications/${notificationId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error("Failed to delete notification");

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      toast.success("Notification deleted");
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Failed to delete notification");
    }
  };

  // Bulk actions
  const handleBulkArchive = async () => {
    if (selectedNotifications.size === 0) return;
    setBulkActionLoading(true);
    
    try {
      for (const id of selectedNotifications) {
        await archiveNotification(id);
      }
      setSelectedNotifications(new Set());
      toast.success(`${selectedNotifications.size} notifications archived`);
    } catch (error) {
      toast.error("Failed to archive notifications");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedNotifications.size === 0) return;
    setBulkActionLoading(true);
    
    try {
      for (const id of selectedNotifications) {
        await deleteNotification(id);
      }
      setSelectedNotifications(new Set());
      toast.success(`${selectedNotifications.size} notifications deleted`);
    } catch (error) {
      toast.error("Failed to delete notifications");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkMarkRead = async () => {
    if (selectedNotifications.size === 0) return;
    setBulkActionLoading(true);
    
    try {
      for (const id of selectedNotifications) {
        await markAsRead(id);
      }
      setSelectedNotifications(new Set());
      toast.success(`${selectedNotifications.size} notifications marked as read`);
    } catch (error) {
      toast.error("Failed to mark notifications as read");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const toggleSelectNotification = (id: string) => {
    const newSelected = new Set(selectedNotifications);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedNotifications(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedNotifications.size === notifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(notifications.map((n) => n.id)));
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "WARNING":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const styles = {
      INFO: "bg-blue-100 text-blue-800 border-blue-200",
      WARNING: "bg-amber-100 text-amber-800 border-amber-200",
      CRITICAL: "bg-red-100 text-red-800 border-red-200",
    };
    return styles[severity as keyof typeof styles] || styles.INFO;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-KE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Get unique notification types for filter
  const notificationTypes = Array.from(new Set(notifications.map((n) => n.type)));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Card className="rounded-none border border-gray-200 shadow-none">
        <CardHeader className="pb-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="h-8 w-8 text-gray-500 hover:text-gray-900"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-50 border border-gray-200">
                  <Bell className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    Notifications
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    Stay updated with your latest activities and alerts
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-gray-300">
                {totalCount} Total
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Filters and Actions Bar */}
          <div className="space-y-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 rounded-sm border-gray-300 focus:border-[#1F3A8A] focus:ring-[#1F3A8A]"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-2">
                <Select value={severityFilter} onValueChange={(v) => {
                  setSeverityFilter(v);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="w-32 rounded-sm border-gray-300">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="INFO">Info</SelectItem>
                    <SelectItem value="WARNING">Warning</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={(v) => {
                  setTypeFilter(v);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="w-40 rounded-sm border-gray-300">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {notificationTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tabs and Bulk Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <Tabs
                value={activeTab}
                onValueChange={(v) => {
                  setActiveTab(v as typeof activeTab);
                  setCurrentPage(1);
                  setSelectedNotifications(new Set());
                }}
                className="w-full sm:w-auto"
              >
                <TabsList className="grid w-full sm:w-75 grid-cols-3 rounded-sm">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="unread">Unread</TabsTrigger>
                  <TabsTrigger value="archived">Archived</TabsTrigger>
                </TabsList>
              </Tabs>

              {selectedNotifications.size > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {selectedNotifications.size} selected
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBulkMarkRead}
                    disabled={bulkActionLoading}
                    className="rounded-sm"
                  >
                    <CheckCheck className="h-4 w-4 mr-2" />
                    Mark Read
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBulkArchive}
                    disabled={bulkActionLoading}
                    className="rounded-sm"
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    Archive
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleBulkDelete}
                    disabled={bulkActionLoading}
                    className="rounded-sm"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              )}

              {activeTab === "unread" && notifications.some((n) => !n.is_read) && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={markAllAsRead}
                  className="rounded-sm"
                >
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Mark all as read
                </Button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 border border-gray-200">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No notifications found</p>
              <p className="text-sm text-gray-500 mt-1">
                {searchTerm || severityFilter !== "all" || typeFilter !== "all"
                  ? "Try adjusting your filters"
                  : "You're all caught up!"}
              </p>
            </div>
          ) : (
            <>
              <div className="border border-gray-200 rounded-sm overflow-hidden">
                {/* Header Row */}
                <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedNotifications.size === notifications.length && notifications.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-[#1F3A8A] focus:ring-[#1F3A8A]"
                    />
                    <span className="text-xs font-medium text-gray-500 uppercase">
                      Select all
                    </span>
                  </div>
                </div>

                {/* Notifications */}
                <div className="divide-y divide-gray-200">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-4 hover:bg-gray-50 transition-colors relative group",
                        !notification.is_read && "bg-blue-50/30"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedNotifications.has(notification.id)}
                          onChange={() => toggleSelectNotification(notification.id)}
                          className="mt-1 rounded border-gray-300 text-[#1F3A8A] focus:ring-[#1F3A8A]"
                        />

                        <div className="shrink-0 mt-1">
                          {getSeverityIcon(notification.severity)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <p
                                className={cn(
                                  "text-sm text-gray-900",
                                  !notification.is_read && "font-semibold"
                                )}
                              >
                                {notification.title}
                              </p>
                              <Badge
                                className={cn(
                                  "text-xs px-2 py-0.5 rounded-full border",
                                  getSeverityBadge(notification.severity)
                                )}
                              >
                                {notification.severity}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {!notification.is_read && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 hover:bg-gray-200"
                                  onClick={() => markAsRead(notification.id)}
                                  title="Mark as read"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              {!notification.is_archived && activeTab !== "archived" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 hover:bg-gray-200"
                                  onClick={() => archiveNotification(notification.id)}
                                  title="Archive"
                                >
                                  <Archive className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 hover:bg-gray-200 hover:text-red-600"
                                onClick={() => deleteNotification(notification.id)}
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>

                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>

                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-400">
                                {formatTime(notification.created_at)}
                              </span>
                            </div>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-400 capitalize">
                              {notification.type.replace(/_/g, " ").toLowerCase()}
                            </span>
                          </div>
                        </div>

                        {/* Unread indicator dot */}
                        {!notification.is_read && (
                          <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-gray-500">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="rounded-sm"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="rounded-sm"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsPage;