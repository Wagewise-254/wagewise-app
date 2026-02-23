// components/company/employees/EmployeeDetailsLayout.tsx
import { Outlet, useParams, useNavigate } from "react-router-dom";
import PageTabs from "@/components/common/PageTabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useEmployee } from "@/hooks/useEmployee";

const toProperCase = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export default function EmployeeDetailsLayout() {
  const { companyId, employeeId } = useParams<{
    companyId: string;
    employeeId: string;
  }>();
  const navigate = useNavigate();
  const { employee, loading, error, refetch } = useEmployee(companyId!, employeeId!);

  const getInitials = () => {
    if (!employee) return "";
    const first = employee.first_name?.[0] || "";
    const last = employee.last_name?.[0] || "";
    return `${first}${last}`.toUpperCase();
  };

  const getStatusBadge = () => {
    if (!employee) return null;

    const status = employee.employee_status;
    const getVariant = (status: string) => {
      switch (status) {
        case "ACTIVE":
          return "bg-emerald-50 text-emerald-700 border-emerald-400";
        case "On Leave":
          return "bg-amber-50 text-amber-700 border-amber-100";
        case "Terminated":
          return "bg-rose-50 text-rose-700 border-rose-100";
        default:
          return "bg-slate-50 text-slate-700 border-slate-100";
      }
    };
    return (
      <Badge variant="outline" className={`${getVariant(status)} font-medium`}>
        {toProperCase(status)}
      </Badge>
    );
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
    <div className="flex gap-2 max-w-7xl mx-auto px-4 h-[calc(100vh-4rem)] overflow-hidden">
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
      <aside className="w-80 shrink-0 sticky top-6 z-10 self-start bg-white border border-slate-200 rounded-md p-4 ">
        <div className="flex flex-col items-center text-center">
          {loading ? (
            <Skeleton className="h-24 w-24 rounded-full" />
          ) : (
            <div className="h-24 w-24 rounded-full bg-indigo-50 flex items-center justify-center text-xl font-semibold text-indigo-600 ring-4 ring-white">
              {getInitials()}
            </div>
          )}

          {loading ? (
            <div className="mt-3 space-y-2">
              <Skeleton className="h-6 w-40 mx-auto" />
              <Skeleton className="h-4 w-48 mx-auto" />
            </div>
          ) : employee ? (
            <>
              <h2 className="mt-3 font-semibold text-slate-900 text-lg">
                {employee.first_name} {employee.middle_name}{" "}
                {employee.last_name}
              </h2>
              <p className="text-sm text-slate-400 mt-1">{employee.email}</p>
              <p className="text-sm text-slate-500">
                {employee.employee_number}
              </p>

              {employee.job_titles && (
                <Badge
                  variant="secondary"
                  className="my-3 px-4 py-1.5 bg-indigo-50 text-indigo-700 border-none font-medium"
                >
                  {employee.job_titles.title}
                </Badge>
              )}

              {getStatusBadge()}

              {employee.departments && (
                <div className="mt-6 w-full pt-4 border-t border-slate-100">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                    Department
                  </p>
                  <p className="text-sm text-slate-700 font-medium">
                    {employee.departments.name}
                    {employee.sub_departments &&
                      ` / ${employee.sub_departments.name}`}
                  </p>
                </div>
              )}
            </>
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
