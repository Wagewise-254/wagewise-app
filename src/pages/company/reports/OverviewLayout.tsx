import { Outlet, useParams} from "react-router-dom";
import PageTabs from "@/components/common/PageTabs";

export default function OverviewLayout() {
  const { companyId } = useParams();

  const tabs = [
    {
      label: "Statutory",
      href: `/company/${companyId}/reports/overview/statutory`,
      exact: true,
    },
    {
      label: "Payments",
      href: `/company/${companyId}/reports/overview/payments`,
    },
    {
      label: "Internal",
      href: `/company/${companyId}/reports/overview/internal`,
    },
  ];

  return (
      
      <div className=" h-full p-2">
        <section className="h-full bg-white border border-slate-200 rounded-sm">

          {/* Tabs */}
          <div className="px-6 pt-6">
            <PageTabs tabs={tabs} />
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            <Outlet />
          </div>

        </section>
      </div>
  );
}
