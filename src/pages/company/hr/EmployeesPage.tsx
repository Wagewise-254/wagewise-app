import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCompanyStore } from "@/stores/companyStore";
import { cn } from "@/lib/utils";
import  CompanyInactiveBanner  from "@/components/common/CompanyInactiveBanner";
import OfflineBanner from '@/components/common/OfflineBanner';

// Section Components
import EmployeeSection from "@/components/company/hr/employee/EmployeeSection";
import PaymentSection from "@/components/company/hr/employee/PaymentSection";

type DeductionTab = "employee" | "payment";

export default function DeductionPage() {
  const [currentTab, setCurrentTab] = useState<DeductionTab>("employee");
  const { companyId } = useParams<{ companyId: string }>();
  const { companies } = useCompanyStore();


    // Find the current company from store
    const company = useMemo(
      () => companies.find((c) => c.id === companyId),
      [companies, companyId]
    );


    // Handle inactive/suspended company
if (company && company.status !== "active") {
  return (
    <CompanyInactiveBanner
      companyId={companyId!}
      status={company.status}
    />
  );
}

  const renderTabContent = () => {
    switch (currentTab) {
      case "employee":
        return <EmployeeSection />;
      case "payment":
        return <PaymentSection />;
      default:
        return null;
    }
  };

  const activeTabClasses =
    "border-b-2 border-[#7F5EFD] text-[#7F5EFD] font-semibold";
  const inactiveTabClasses = "text-gray-600 hover:text-gray-800";

  return (
    <div className="flex h-auto bg-gray-100">
      <OfflineBanner/>
      <div className="flex-1 flex flex-col p-6 bg-white rounded-md overflow-hidden">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          Employee Management
        </h1>

        {/* Tabs */}
        <div className="flex space-x-4 border-b border-gray-200 mb-6">
          <Button
            variant="ghost"
            className={cn(
              "relative px-4 py-3 rounded-none transition-colors duration-200 cursor-pointer",
              currentTab === "employee" ? activeTabClasses : inactiveTabClasses
            )}
            onClick={() => setCurrentTab("employee")}
          >
            Employee
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "relative px-4 py-3 rounded-none transition-colors duration-200 cursor-pointer",
              currentTab === "payment" ? activeTabClasses : inactiveTabClasses
            )}
            onClick={() => setCurrentTab("payment")}
          >
            Payment
          </Button>
        </div>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-auto">{renderTabContent()}</div>
      </div>
    </div>
  );
}
