import { useMemo, useEffect, useState } from "react";
import OfflineBanner from "@/components/common/offlinebanner";
import { useParams, Link } from "react-router-dom";
import { useAuthStore, Company } from "@/stores/authStore";
import { Card } from "@/components/ui/card";
import CompanyInactiveBanner from "@/components/common/companyInactiveBanner";
import { Users, Wallet, BarChart3, Settings, ArrowUpRight } from "lucide-react";
const ModuleDashboard = () => {
  const { activeWorkspace } = useAuthStore();
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const { companyId } = useParams();
  const { companies: companyMemberships } = useAuthStore();

 const companies = useMemo(() => {
    return companyMemberships.map((m) => m.companies);
  }, [companyMemberships]);

  useEffect(() => {
    const foundCompany = companies.find((c) => c.id === companyId);
    setCurrentCompany(foundCompany || null);
  }, [companyId, companies]);

  const modules = [
    {
      name: "Employees",
      link: `/company/${currentCompany?.id}/employees`,
      description: "Manage your workforce, records and directory.",
      icon: <Users className="w-6 h-6" />,
      color: "bg-blue-50 text-blue-600",
    },
    {
      name: "Payroll",
      link: `/company/${currentCompany?.id}/payroll`,
      description: "Process salaries, taxes, and disbursements.",
      icon: <Wallet className="w-6 h-6" />,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      name: "Reports",
      link: `/company/${currentCompany?.id}/reports/overview`,
      description: "Analyze business performance and analytics.",
      icon: <BarChart3 className="w-6 h-6" />,
      color: "bg-purple-50 text-purple-600",
    },
    {
      name: "Settings",
      link: `/company/${currentCompany?.id}/settings/overview`,
      description: "Configure organization and preferences.",
      icon: <Settings className="w-6 h-6" />,
      color: "bg-slate-50 text-slate-600",
    },
  ];

  if (currentCompany && currentCompany.status !== "APPROVED") {
    return <CompanyInactiveBanner status={currentCompany.status} />;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 ">
      <OfflineBanner />

      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          Welcome back, {activeWorkspace?.full_names.split(" ")[0]}
        </h1>
        <p className="text-gray-500 mt-2">
          Select a module to manage{" "}
          <span className="font-semibold text-[#1F3A8A]">
            {currentCompany?.business_name}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {modules.map((module) => (
          <Link to={module.link} key={module.name} className="group">
            <Card className="relative overflow-hidden h-full border-slate-200 bg-white p-6 transition-all duration-300 hover:border-[#1F3A8A]/50 hover:shadow-xl hover:shadow-blue-500/5 group-hover:-translate-y-1">
              {/* Decorative Background Glow */}
              <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-slate-50 transition-colors group-hover:bg-blue-50/50" />
              
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  {/* Icon Container */}
                  <div className={`mb-5 inline-flex p-3 rounded-xl ${module.color} transition-transform duration-300 group-hover:scale-110`}>
                    {module.icon}
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center">
                    {module.name}
                  </h3>
                  
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {module.description}
                  </p>
                </div>

                <div className="mt-6 flex items-center text-sm font-semibold text-[#1F3A8A] opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1">
                  Open Module
                  <ArrowUpRight className="ml-1 w-4 h-4" />
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ModuleDashboard;
