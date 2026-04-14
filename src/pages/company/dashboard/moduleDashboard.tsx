// pages/company/dashboard/moduleDashboard.tsx
import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";
import { API_BASE_URL } from "@/config";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  UserPlus,
  CreditCard,
  FileText,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  DollarSign,
  UserCheck,
  Activity,
  UserCog,
  Briefcase,
  Mail
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid
} from "recharts";

// Types
interface EmployeeStats {
  total: number;
  active: number;
  onLeave: number;
  terminated: number;
  suspended: number;
  newThisMonth: number;
}

interface PayrollStats {
  totalPayrollThisYear: number;
  averageGrossPay: number;
  latestPayroll: {
    id: string;
    month: string;
    year: number;
    status: string;
    grossPay: number;
    netPay: number;
  } | null;
  payrollStatus: {
    draft: number;
    under_review: number;
    approved: number;
    paid: number;
  };
  monthlyTrend: Array<{
    month: string;
    year: number;
    grossPay: number;
    netPay: number;
  }>;
}

interface PayrollRun {
  id: string;
  payroll_number: string;
  payroll_month: string;
  payroll_year: number;
  payroll_date: string;
  status: string;
  total_gross_pay: number;
  total_net_pay: number;
}

interface Deadline {
  type: string;
  title: string;
  description: string;
  status: string;
  entityId: string;
  dueDate: string;
  actionUrl: string;
}

interface RecentEmployee {
  id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  email: string;
  hire_date: string;
  created_at: string;
  departments: { name: string } | null;
  job_titles: { title: string } | null;
}

interface DepartmentStat {
  id: string;
  name: string;
  employeeCount: number;
}

interface PendingApproval {
  type: string;
  title: string;
  description: string;
  entityId: string;
  actionUrl: string;
}

interface DashboardData {
  employeeStats: EmployeeStats;
  payrollStats: PayrollStats;
  recentPayrollRuns: PayrollRun[];
  upcomingDeadlines: Deadline[];
  recentEmployees: RecentEmployee[];
  departmentStats: DepartmentStat[];
  pendingApprovals: PendingApproval[];
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  url: string;
}

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "paid":
      return "bg-emerald-100 text-emerald-700";
    case "approved":
      return "bg-blue-100 text-blue-700";
    case "under_review":
      return "bg-amber-100 text-amber-700";
    case "draft":
      return "bg-slate-100 text-slate-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const formatCurrency = (value: number | undefined) => {
  if (!value) return "KES 0";
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const ModuleDashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const [loading, setLoading] = useState(true);
  const { session } = useAuthStore();
  const { companyId } = useParams();
  const navigate = useNavigate();

  const fetchDashboardData = useCallback(async () => {
    if (!companyId || !session?.access_token) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/company/${companyId}/dashboard/overview`,
        {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch dashboard data");

      const result = await res.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [companyId, session?.access_token]);

  const fetchQuickActions = useCallback(async () => {
    if (!companyId || !session?.access_token) {
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/company/${companyId}/dashboard/quick-actions`,
        {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch quick actions");

      const result = await res.json();
      // Replace payroll settings with user management link
      const actions = result.actions.map((action: QuickAction) => {
        if (action.id === "payroll_settings") {
          return {
            ...action,
            id: "user_management",
            title: "User Management",
            description: "Manage users and team members",
            icon: "UserCog",
            url: `/company/${companyId}/settings/profiles`
          };
        }
        return action;
      });
      setQuickActions(actions);
    } catch (error) {
      console.error("Error fetching quick actions:", error);
    }
  }, [companyId, session?.access_token]);

  useEffect(() => {
    fetchDashboardData();
    fetchQuickActions();
  }, [fetchDashboardData, fetchQuickActions]);

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, React.ElementType> = {
      UserPlus, CreditCard, FileText, TrendingUp,DollarSign, Users, UserCog, Briefcase, Mail, 
    };
    const Icon = icons[iconName] || Users;
    return <Icon className="h-5 w-5" />;
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center mb-6">
          <Activity className="h-12 w-12 text-slate-400" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">
          Welcome to Your Dashboard
        </h3>
        <p className="text-slate-500 max-w-md mb-6">
          Get started by adding employees, setting up your organization, or running your first payroll.
        </p>
        <Button
          onClick={() => navigate(`/company/${companyId}/employees/add-employee`)}
          className="bg-[#7F5EFD] hover:bg-[#6B4EE3] text-white"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add Your First Employee
        </Button>
      </div>
    );
  }

  const activePercentage = data.employeeStats.total > 0
    ? (data.employeeStats.active / data.employeeStats.total) * 100
    : 0;

  return (
    <div className="space-y-6 p-6 pb-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Overview of your organization's payroll and employee metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardData}
          >
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      {quickActions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-800 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={() => navigate(action.url)}
                className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-slate-200 hover:border-[#7F5EFD] hover:shadow-md transition-all group cursor-pointer"
              >
                <div className="h-10 w-10 rounded-full bg-[#7F5EFD]/10 flex items-center justify-center text-[#7F5EFD] group-hover:bg-[#7F5EFD] group-hover:text-white transition-colors">
                  {getIconComponent(action.icon)}
                </div>
                <span className="text-xs font-medium text-slate-700 text-center">
                  {action.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Employees"
          value={data.employeeStats.total}
          icon={<Users className="h-5 w-5 text-blue-600" />}
          trend={`+${data.employeeStats.newThisMonth} this month`}
          trendUp
        />
        <MetricCard
          title="Active Employees"
          value={data.employeeStats.active}
          icon={<UserCheck className="h-5 w-5 text-emerald-600" />}
          subtext={`${activePercentage.toFixed(0)}% of total`}
          progress={activePercentage}
        />
        <MetricCard
          title="Year-to-Date Payroll"
          value={formatCurrency(data.payrollStats.totalPayrollThisYear)}
          icon={<DollarSign className="h-5 w-5 text-amber-600" />}
        />
        <MetricCard
          title="Average Gross Pay"
          value={formatCurrency(data.payrollStats.averageGrossPay)}
          icon={<TrendingUp className="h-5 w-5 text-purple-600" />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payroll Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Payroll Trend</CardTitle>
            <p className="text-xs text-slate-500">Gross vs Net Pay over time</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.payrollStats.monthlyTrend.slice().reverse()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                  interval={0}
                />
                <YAxis 
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(v) => formatCurrency(Number(v))}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="grossPay" 
                  stroke="#7F5EFD" 
                  strokeWidth={2}
                  dot={{ fill: "#7F5EFD", r: 4 }}
                  name="Gross Pay"
                />
                <Line 
                  type="monotone" 
                  dataKey="netPay" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: "#10b981", r: 4 }}
                  name="Net Pay"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Department Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Department Size</CardTitle>
            <p className="text-xs text-slate-500">Employee distribution by department</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.departmentStats.map((dept) => {
                const percentage = (dept.employeeCount / data.employeeStats.total) * 100;
                return (
                  <div key={dept.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-700">{dept.name}</span>
                      <span className="text-slate-500">{dept.employeeCount} employees</span>
                    </div>
                    <Progress value={percentage} className="h-2" indicatorClassName="bg-[#7F5EFD]" />
                  </div>
                );
              })}
              {data.departmentStats.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-8">
                  No departments created yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payroll Runs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Recent Payroll Runs</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/company/${companyId}/payroll/history`)}
              className="text-xs text-[#7F5EFD] hover:text-[#6B4EE3] hover:bg-[#7F5EFD]/10"
            >
              View All
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentPayrollRuns.map((run) => (
                <button
                  key={run.id}
                  onClick={() => navigate(`/company/${companyId}/payroll/${run.id}/review-status`)}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-slate-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-slate-900">
                        {run.payroll_month} {run.payroll_year}
                      </p>
                      <p className="text-xs text-slate-500">
                        {run.payroll_number || "Payroll Run"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(run.status)}>
                      {run.status?.replace("_", " ")}
                    </Badge>
                    <p className="text-xs font-medium text-slate-700 mt-1">
                      {formatCurrency(run.total_net_pay)}
                    </p>
                  </div>
                </button>
              ))}
              {data.recentPayrollRuns.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-8">
                  No payroll runs yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Deadlines & Pending Approvals */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Attention Required</CardTitle>
            <p className="text-xs text-slate-500">Upcoming deadlines and pending approvals</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.pendingApprovals.map((approval, idx) => (
                <button
                  key={`approval-${idx}`}
                  onClick={() => navigate(approval.actionUrl)}
                  className="w-full flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-100 hover:bg-amber-100 transition-colors"
                >
                  <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-amber-800">{approval.title}</p>
                    <p className="text-xs text-amber-600">{approval.description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-amber-600 shrink-0" />
                </button>
              ))}
              
              {data.upcomingDeadlines.map((deadline, idx) => (
                <button
                  key={`deadline-${idx}`}
                  onClick={() => navigate(deadline.actionUrl)}
                  className="w-full flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <Clock className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-slate-900">{deadline.title}</p>
                    <p className="text-xs text-slate-500">{deadline.description}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Due: {formatDate(deadline.dueDate)}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 shrink-0" />
                </button>
              ))}

              {data.pendingApprovals.length === 0 && data.upcomingDeadlines.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">All caught up!</p>
                  <p className="text-xs text-slate-400">No pending items require your attention</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Employees */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">Recently Added Employees</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/company/${companyId}/employees`)}
            className="text-xs text-[#7F5EFD] hover:text-[#6B4EE3] hover:bg-[#7F5EFD]/10"
          >
            View All
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-slate-500 border-b">
                <tr>
                  <th className="text-left py-2 px-3">Employee</th>
                  <th className="text-left py-2 px-3">Employee #</th>
                  <th className="text-left py-2 px-3">Department</th>
                  <th className="text-left py-2 px-3">Job Title</th>
                  <th className="text-left py-2 px-3">Hire Date</th>
                </tr>
              </thead>
              <tbody>
                {data.recentEmployees.map((emp) => (
                  <tr
                    key={emp.id}
                    className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                    onClick={() => navigate(`/company/${companyId}/employees/${emp.id}/personal`)}
                  >
                    <td className="py-3 px-3">
                      <p className="font-medium text-slate-900">
                        {emp.first_name} {emp.last_name}
                      </p>
                      <p className="text-xs text-slate-500">{emp.email}</p>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{emp.employee_number}</td>
                    <td className="py-3 px-3 text-slate-600">{emp.departments?.name || "-"}</td>
                    <td className="py-3 px-3 text-slate-600">{emp.job_titles?.title || "-"}</td>
                    <td className="py-3 px-3 text-slate-500">
                      {emp.hire_date ? formatDate(emp.hire_date) : "-"}
                    </td>
                  </tr>
                ))}
                {data.recentEmployees.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No employees added yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  subtext?: string;
  progress?: number;
}

const MetricCard = ({ title, value, icon, trend, trendUp, subtext, progress }: MetricCardProps) => (
  <Card>
    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
      <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
      <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center">
        {icon}
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      {progress !== undefined && (
        <Progress value={progress} className="h-1.5 mt-2" indicatorClassName="bg-[#7F5EFD]" />
      )}
      {trend && (
        <p className={cn(
          "text-xs mt-2 flex items-center gap-1",
          trendUp ? "text-emerald-600" : "text-amber-600"
        )}>
          {trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {trend}
        </p>
      )}
      {subtext && (
        <p className="text-xs text-slate-500 mt-1">{subtext}</p>
      )}
    </CardContent>
  </Card>
);

// Skeleton Component
const DashboardSkeleton = () => (
  <div className="space-y-6 p-6 pb-8">
    <div className="flex justify-between">
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-9 w-24" />
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-3 w-40" />
          </CardContent>
        </Card>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-3 w-48 mt-1" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-3 w-48 mt-1" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

export default ModuleDashboard;