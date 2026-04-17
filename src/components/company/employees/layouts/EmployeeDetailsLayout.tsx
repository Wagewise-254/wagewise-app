// components/company/employees/EmployeeDetailsLayout.tsx
import { Outlet, useParams, useNavigate } from "react-router-dom";
import PageTabs from "@/components/common/PageTabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  History,
  Mail,
  Briefcase,
  Calendar,
  Phone,
  Building2,
  Users2,
} from "lucide-react";
import { useEmployee } from "@/hooks/useEmployee";
import { format } from "date-fns";

const formatDate = (dateString?: string | null) => {
  if (!dateString) return "Not specified";
  try {
    return format(new Date(dateString), "MMM dd, yyyy");
  } catch {
    return dateString;
  }
};


export default function EmployeeDetailsLayout() {
  const { companyId, employeeId } = useParams<{
    companyId: string;
    employeeId: string;
  }>();
  const navigate = useNavigate();
  const { employee, loading, error, refetch } = useEmployee(
    companyId!,
    employeeId!,
  );

  const getInitials = () => {
    if (!employee) return "";
    const first = employee.first_name?.[0] || "";
    const last = employee.last_name?.[0] || "";
    return `${first}${last}`.toUpperCase();
  };

  const getStatusConfig = () => {
    if (!employee) return null;

    const status = employee.employee_status;
    const configs = {
      ACTIVE: {
        variant: "bg-emerald-50 text-emerald-700 border-emerald-200",
        dot: "bg-emerald-500",
        label: "Active",
      },
      "ON LEAVE": {
        variant: "bg-amber-50 text-amber-700 border-amber-200",
        dot: "bg-amber-500",
        label: "On Leave",
      },
      TERMINATED: {
        variant: "bg-rose-50 text-rose-700 border-rose-200",
        dot: "bg-rose-500",
        label: "Terminated",
      },
      PENDING: {
        variant: "bg-slate-50 text-slate-700 border-slate-200",
        dot: "bg-slate-400",
        label: "Pending",
      },
    };
    return configs[status as keyof typeof configs] || configs.PENDING;
  };


  const tabs = [
    {
      label: "Personal details",
      href: `/company/${companyId}/employees/${employeeId}/personal`,
      exact: true,
    },
    {
      label: "Contracts",
      href: `/company/${companyId}/employees/${employeeId}/contracts`,
    },
    {
      label: "Payments",
      href: `/company/${companyId}/employees/${employeeId}/payments`,
    },
    {
      label: "History", // New tab
      href: `/company/${companyId}/employees/${employeeId}/history`,
    },
    {
      label: "Deductions",
      href: `/company/${companyId}/employees/${employeeId}/deductions`,
    },
    {
      label: "Allowances",
      href: `/company/${companyId}/employees/${employeeId}/allowances`,
    },
  ];

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-slate-900">Error</h3>
          <p className="text-slate-600 mt-2">{error}</p>
          <Button
            onClick={() => navigate(`/company/${companyId}/employees`)}
            className="mt-4"
          >
            Back to Employees
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2 max-w-7xl mx-auto px-4 h-[calc(100vh-2rem)] overflow-hidden">
      {/* Back Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 cursor-pointer shrink-0 sticky top-6 border border-slate-200"
            onClick={() => navigate(`/company/${companyId}/employees`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Back to Employees</p>
        </TooltipContent>
      </Tooltip>

      {/* Left profile card */}
      <aside className="w-80 shrink-0 sticky top-6 z-10 self-start">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <ProfileCardSkeleton />
          ) : employee ? (
            <div className="p-5">
              {/* Avatar and Basic Info */}
              <div className="flex flex-col items-center text-center mb-6">
                <div className="h-20 w-20 rounded-full bg-linear-to-br from-indigo-50 to-indigo-100 flex items-center justify-center text-2xl font-semibold text-indigo-600 ring-4 ring-white shadow-sm">
                  {getInitials()}
                </div>
                
                <h2 className="mt-3 font-semibold text-slate-900 text-lg leading-tight">
                  {employee.first_name} {employee.middle_name} {employee.last_name}
                </h2>
                
                {/* Status Badge */}
                <div className="mt-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-white shadow-sm">
                    <span className={`w-1.5 h-1.5 rounded-full ${getStatusConfig()?.dot}`} />
                    <span>{getStatusConfig()?.label}</span>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-2 mb-6">
                <div className="flex items-center justify-between text-sm py-2">
                  <span className="text-slate-500 text-xs uppercase tracking-wider font-medium">
                    Employee No.
                  </span>
                  <span className="font-mono text-slate-900 font-medium text-sm">
                    {employee.employee_number}
                  </span>
                </div>

                <div className="border-t border-slate-100" />
                <div className="flex items-center justify-between gap-2 text-sm">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-slate-600 truncate text-sm">
                    {employee.email || "No email provided"}
                  </span>
                </div>

                {employee.phone && (
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-slate-600 text-sm">{employee.phone}</span>
                  </div>
                )}
              </div>

              {/* Job Title Section */}
              {employee.job_titles && (
                <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-start gap-2">
                    <Briefcase className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-500 mb-0.5 font-medium">
                        Current Position
                      </p>
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {employee.job_titles.title}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Department Section */}
              {employee.departments && (
                <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-start gap-2">
                    <Building2 className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-slate-500 mb-0.5 font-medium">
                        Department
                      </p>
                      <p className="text-sm font-medium text-slate-900">
                        {employee.departments.name}
                      </p>
                      {employee.sub_departments && (
                        <>
                          <div className="h-px bg-slate-200 my-2" />
                          <div className="flex items-start gap-2">
                            <Users2 className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
                            <div className="flex-1">
                              <p className="text-xs text-slate-500 mb-0.5 font-medium">
                                Sub-department
                              </p>
                              <p className="text-sm text-slate-700">
                                {employee.sub_departments.name}
                              </p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Start Date from Hire Date */}
              {employee.hire_date && (
                <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-slate-500 mb-0.5 font-medium">
                        Hire Date
                      </p>
                      <p className="text-sm font-medium text-slate-900">
                        {formatDate(employee.hire_date)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 mt-6 pt-4 border-t border-slate-200">
                <Button
                  variant="default"
                  size="sm"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 shadow-sm"
                  onClick={() =>
                    navigate(
                      `/company/${companyId}/employees/${employeeId}/history`,
                    )
                  }
                >
                  <History className="w-4 h-4 mr-2" />
                  View History
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </aside>

      {/* Right content */}
      <section className="flex-1 flex flex-col overflow-hidden">
        <div className="sticky top-6 mb-8 z-30 bg-white/80 backdrop-blur-md border border-slate-200 rounded-md p-4">
          <PageTabs tabs={tabs} />
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-md">
            <div className="p-8">
              {loading ? (
                <LoadingSkeleton />
              ) : (
                <Outlet context={{ employee, refetch }} />
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ProfileCardSkeleton() {
  return (
    <div className="p-5">
      <div className="flex flex-col items-center text-center mb-6">
        <Skeleton className="h-20 w-20 rounded-full" />
        <Skeleton className="h-6 w-40 mt-3" />
        <Skeleton className="h-5 w-24 mt-2" />
      </div>
      <div className="space-y-3 mb-6">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-px w-full" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-9 w-full mt-4" />
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-8 w-48 bg-slate-100 rounded-lg" />
      <div className="grid grid-cols-2 gap-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-20 bg-slate-50 rounded" />
            <div className="h-5 w-40 bg-slate-100 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
