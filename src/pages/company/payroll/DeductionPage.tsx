import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Section Components
import DeductionManageSection from "@/components/company/payroll/deductions/DeductionManageSection";
import DeductionAssignSection from "@/components/company/payroll/deductions/DeductionAssignSection";

type DeductionTab = "manage" | "assign";

export default function DeductionPage() {
  const [currentTab, setCurrentTab] = useState<DeductionTab>("manage");

  const renderTabContent = () => {
    switch (currentTab) {
      case "manage":
        return <DeductionManageSection />;
      case "assign":
        return <DeductionAssignSection />;
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
          Deduction Management
        </h1>

        {/* Tabs */}
        <div className="flex space-x-4 border-b border-gray-200 mb-6">
          <Button
            variant="ghost"
            className={cn(
              "relative px-4 py-3 rounded-none transition-colors duration-200 cursor-pointer",
              currentTab === "manage" ? activeTabClasses : inactiveTabClasses
            )}
            onClick={() => setCurrentTab("manage")}
          >
            Manage Deductions
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "relative px-4 py-3 rounded-none transition-colors duration-200 cursor-pointer",
              currentTab === "assign" ? activeTabClasses : inactiveTabClasses
            )}
            onClick={() => setCurrentTab("assign")}
          >
            Assign Deductions
          </Button>
        </div>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-auto">{renderTabContent()}</div>
      </div>
    </div>
  );
}
