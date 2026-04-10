import { Outlet, useParams } from "react-router-dom";
import PageTabs from "@/components/common/PageTabs";

export default function BenefitLayout() {
  const { companyId } = useParams();

  const tabs = [
    {
      label: "Company",
      href: `/company/${companyId}/settings`,
      exact: true,
    },
    {
      label: "Profiles",
      href: `/company/${companyId}/settings/profiles`,
    },
    {
      label: "Reviewers",
      href: `/company/${companyId}/settings/reviewers`,
    },
    {
      label: "Logs",
      href: `/company/${companyId}/settings/logs`,
    },
  ];

  return (
    <div className="h-full py-2">
       <section className="h-full  bg-white border border-slate-200 rounded-md flex flex-col overflow-hidden">
        {/* The Tab Navigation */}
        <div className="px-6 pt-6 shrink-0">
          <PageTabs tabs={tabs} />
        </div>

        {/* This renders the actual page component (EmployeeSection, etc.) */}
         <div className="flex-1 overflow-y-auto min-h-0">
          <Outlet />
        </div>
      </section>
    </div>
  );
}
