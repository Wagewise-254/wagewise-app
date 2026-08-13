import { Outlet, useParams } from "react-router-dom";
import PageTabs from "@/components/common/PageTabs";

export default function PayrollEmployeeLayout() {
  const { companyId, payrollRunId } = useParams();

  const tabs = [
    {
      label: "Included",
      href: `/company/${companyId}/payroll/${payrollRunId}/employees/included`,
      exact: true,
    },
    {
      label: "Excluded",
      href: `/company/${companyId}/payroll/${payrollRunId}/employees/excluded`,
    }
  ];

  return (
    <div className="h-full  overflow-y-auto">
      <section className="h-full pb-4 bg-white border border-slate-200 rounded-md">
        <header className="flex items-start justify-between px-6 pt-5 pb-3  border-slate-200">
          <div className="space-y-1">
              <h1 className="text-2xl font-semibold text-slate-900">
                Employees
              </h1>
              <p className="text-sm text-slate-400 ">
            </p>
          </div>
        </header>

        {/* The Tab Navigation */}
        <div className="px-6 pt-3">
          <PageTabs tabs={tabs} />
        </div>

        {/* This renders the actual page component (EmployeeSection, etc.) */}
        <div className="px-6 py-1 ">
          <Outlet />
        </div>
      </section>
    </div>
  );
}
