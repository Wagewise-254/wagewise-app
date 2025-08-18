import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Section Components
import OverviewPayrollSection from "@/components/company/payroll/payRuns/OverviewPayrollSection";
import PayRunSection from "@/components/company/payroll/payRuns/PayRunSection";

type PayRunTab = "overview" | "payRun";

export default function PayRunPage() {
  const [currentTab, setCurrentTab] = useState<PayRunTab>("overview");

  const renderTabContent = () => {
    switch (currentTab) {
      case "overview":
        return <OverviewPayrollSection />;
      case "payRun":
        return <PayRunSection />;
      default:
        return null;
    }
  };

  const activeTabClasses =
    "border-b-2 border-[#7F5EFD] text-[#7F5EFD] font-semibold";
  const inactiveTabClasses = "text-gray-600 hover:text-gray-800";

  return (
    <div className="flex h-auto bg-gray-100">
      <div className="flex-1 flex flex-col p-6 bg-white rounded-md overflow-hidden">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          Payroll Management
        </h1>

        {/* Tabs */}
        <div className="flex space-x-4 border-b border-gray-200 mb-6">
          <Button
            variant="ghost"
            className={cn(
              "relative px-4 py-3 rounded-none transition-colors duration-200 cursor-pointer",
              currentTab === "overview" ? activeTabClasses : inactiveTabClasses
            )}
            onClick={() => setCurrentTab("overview")}
          >
            Overview
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "relative px-4 py-3 rounded-none transition-colors duration-200 cursor-pointer",
              currentTab === "payRun" ? activeTabClasses : inactiveTabClasses
            )}
            onClick={() => setCurrentTab("payRun")}
          >
            pay runs
          </Button>
        </div>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-auto">{renderTabContent()}</div>
      </div>
    </div>
  );
}
