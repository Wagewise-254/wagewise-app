// components/company/employees/EmployeeHistoryTab.tsx
import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Employee } from "@/types/employees";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  History, 
  DollarSign, 
  UserCheck, 
  FileText,
  Plus,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { useHistory, SalaryHistory, StatusHistory, ContractHistory } from "@/hooks/useHistory";
import AddSalaryDialog from "./AddSalaryDialog";
import AddStatusDialog from "./AddStatusDialog";

interface OutletContext {
  employee: Employee;
  refetch: () => void;
}

export default function EmployeeHistoryTab() {
  const { employee } = useOutletContext<OutletContext>();
  const [activeTab, setActiveTab] = useState("salary");
  const [isAddSalaryOpen, setIsAddSalaryOpen] = useState(false);
  const [isAddStatusOpen, setIsAddStatusOpen] = useState(false);
  
  const { 
    salaryHistory, 
    statusHistory, 
    contractHistory,
    loading,
    refetch 
  } = useHistory(employee.company_id, employee.id);

  const getChangedByName = (item: SalaryHistory | StatusHistory | ContractHistory): string => {
    if (item.changed_by_user?.full_name) {
      return item.changed_by_user.full_name;
    }
    if (item.changed_by_user?.email) {
      return item.changed_by_user.email;
    }
    return 'Unknown User';
  };

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-900">
            Employee History & Changes
          </h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* History Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="salary" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Salary
          </TabsTrigger>
          <TabsTrigger value="status" className="flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            Status
          </TabsTrigger>
          <TabsTrigger value="contracts" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Contracts
          </TabsTrigger>
        </TabsList>

        {/* Salary History Tab */}
        <TabsContent value="salary" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-slate-700">
              Salary Change History
            </h3>
            <Button
              onClick={() => setIsAddSalaryOpen(true)}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Update Salary
            </Button>
          </div>

          {loading.salary ? (
            <HistorySkeleton />
          ) : salaryHistory.length === 0 ? (
            <EmptyState message="No salary history found" />
          ) : (
            <div className="space-y-3">
              {salaryHistory.map((item) => (
                <HistoryCard
                  key={item.id}
                  title={`KES ${item.salary.toLocaleString()}`}
                  subtitle={item.reason || undefined}
                  date={item.effective_date}
                  created={item.created_at}
                  changedBy={getChangedByName(item)}
                  notes={item.notes || undefined}
                  badge={{
                    text: "Salary Change",
                    variant: "default"
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Status History Tab */}
        <TabsContent value="status" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-slate-700">
              Status Change History
            </h3>
            <Button
              onClick={() => setIsAddStatusOpen(true)}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Update Status
            </Button>
          </div>

          {loading.status ? (
            <HistorySkeleton />
          ) : statusHistory.length === 0 ? (
            <EmptyState message="No status history found" />
          ) : (
            <div className="space-y-3">
              {statusHistory.map((item) => (
                <HistoryCard
                  key={item.id}
                  title={item.status}
                  subtitle={item.reason || undefined}
                  date={item.effective_date}
                  created={item.created_at}
                  changedBy={getChangedByName(item)}
                  notes={item.notes || undefined}
                  badge={{
                    text: "Status Change",
                    variant: item.status === "ACTIVE" ? "success" : "warning"
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Contract History Tab */}
        <TabsContent value="contracts" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-slate-700">
              Contract Change History
            </h3>
          </div>
          
          {loading.contract ? (
            <HistorySkeleton />
          ) : contractHistory.length === 0 ? (
            <EmptyState message="No contract history found" />
          ) : (
            <div className="space-y-3">
              {contractHistory.map((item) => (
                <HistoryCard
                  key={item.id}
                  title={item.contract_type}
                  subtitle={`${item.contract_status} • ${item.reason || "Contract update"}`}
                  date={item.start_date}
                  created={item.created_at}
                  changedBy={getChangedByName(item)}
                  notes={`End Date: ${item.end_date || "N/A"} • Probation: ${item.probation_end_date || "N/A"}`}
                  badge={{
                    text: item.contract_status,
                    variant: item.contract_status === "ACTIVE" ? "success" : "secondary"
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs for manual updates */}
      <AddSalaryDialog
        employee={employee}
        isOpen={isAddSalaryOpen}
        onClose={() => setIsAddSalaryOpen(false)}
        onSuccess={() => {
          setIsAddSalaryOpen(false);
          refetch();
        }}
      />

      <AddStatusDialog
        employee={employee}
        isOpen={isAddStatusOpen}
        onClose={() => setIsAddStatusOpen(false)}
        onSuccess={() => {
          setIsAddStatusOpen(false);
          refetch();
        }}
      />
    </div>
  );
}

// Helper Components (unchanged)
function HistoryCard({ 
  title, 
  subtitle, 
  date, 
  created, 
  changedBy, 
  notes,
  badge 
}: { 
  title: string;
  subtitle?: string;
  date: string;
  created: string;
  changedBy?: string;
  notes?: string;
  badge?: { text: string; variant: "default" | "success" | "warning" | "secondary" };
}) {
  const getBadgeClasses = (variant: string) => {
    switch(variant) {
      case "success": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "warning": return "bg-amber-50 text-amber-700 border-amber-200";
      case "secondary": return "bg-slate-50 text-slate-700 border-slate-200";
      default: return "bg-indigo-50 text-indigo-700 border-indigo-200";
    }
  };

  return (
    <Card className="rounded-sm shadow-none border border-slate-300 hover:shadow-sm transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-slate-900">{title}</h4>
              {badge && (
                <Badge variant="outline" className={getBadgeClasses(badge.variant)}>
                  {badge.text}
                </Badge>
              )}
            </div>
            {subtitle && (
              <p className="text-sm text-slate-600">{subtitle}</p>
            )}
            {notes && (
              <p className="text-xs text-slate-500 mt-1">{notes}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
              <span>Effective: {format(new Date(date), "MMM d, yyyy")}</span>
              <span>•</span>
              <span>Recorded: {format(new Date(created), "MMM d, yyyy")}</span>
              {changedBy && (
                <>
                  <span>•</span>
                  <span>By: {changedBy}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function HistorySkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="animate-pulse space-y-2">
              <div className="h-4 w-32 bg-slate-200 rounded" />
              <div className="h-3 w-48 bg-slate-100 rounded" />
              <div className="h-2 w-64 bg-slate-50 rounded" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <History className="w-8 h-8 text-slate-300 mx-auto mb-3" />
        <p className="text-sm text-slate-500">{message}</p>
      </CardContent>
    </Card>
  );
}