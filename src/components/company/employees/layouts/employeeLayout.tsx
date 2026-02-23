import { Outlet, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import PageTabs from "@/components/common/PageTabs";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function EmployeeLayout() {
  const { companyId } = useParams();
  const navigate = useNavigate();

  const tabs = [
    {
      label: "Active Employees",
      href: `/company/${companyId}/employees`,
      exact: true,
    },
    {
      label: "Non Active Employees",
      href: `/company/${companyId}/employees/non-active`,
    },
    {
      label: "Terminated",
      href: `/company/${companyId}/employees/terminated`,
    },
  ];

  return (
    <div className="h-full p-4 overflow-y-auto">
      <section className="h-full bg-white border border-slate-200 rounded-md">
        <header className="flex items-start justify-between px-6 pt-5 pb-3  border-slate-200">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 cursor-pointer"
                    onClick={() => navigate(`/company/${companyId}/modules`)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Back</p>
                </TooltipContent>
              </Tooltip>

              <h1 className="text-2xl font-semibold text-slate-900">
                Employees
              </h1>
            </div>

            <p className="text-sm text-slate-400 pl-11">
              Manage employee records, status, and lifecycle.
            </p>
          </div>
        </header>

        {/* The Tab Navigation */}
        <div className="px-6 pt-3">
          <PageTabs tabs={tabs} />
        </div>

        {/* This renders the actual page component (EmployeeSection, etc.) */}
        <div className="px-6 py-4 ">
          <Outlet />
        </div>
      </section>
    </div>
  );
}
