// src/pages/dashboard/payroll/PayrollPage.tsx - CORRECTED

import { useState } from "react";
import SideNav from "@/components/dashboard/layout/sideNav";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import ProcessPayrollSection from "@/components/dashboard/payroll/ProcessPayrollSection";
import PayrollHistorySection from "@/components/dashboard/payroll/PayrollHistorySection";
import PayrollReportsSection from "@/components/dashboard/payroll/PayrollReportsSection";
import PayrollRunDetailsView from "@/components/dashboard/payroll/PayrollRunDetailsView";
import PayrollProgressDialog from "@/components/dashboard/payroll/PayrollProgressDialog";

type PayrollTab = "process" | "history" | "reports" | "details";

const PayrollPage = () => {
  const [currentTab, setCurrentTab] = useState<PayrollTab>("process");
  const [refetchHistoryTrigger, setRefetchHistoryTrigger] = useState(0);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  const [progressDialogState, setProgressDialogState] = useState<{
    isOpen: boolean;
    runId: string | null;
    monthYear: string;
  }>({ isOpen: false, runId: null, monthYear: "" });

  const handleProcessingComplete = (success: boolean) => {
    // This is called when a new run from "Process Payroll" or a "Rerun" is finished
    if (success) {
      setRefetchHistoryTrigger((prev) => prev + 1);
      setCurrentTab("history");
    }
  };

  const handleViewDetails = (runId: string) => {
    setSelectedRunId(runId);
    setCurrentTab("details");
  };

  // CHANGE: This is the unified function to open the progress dialog for a new run or a rerun.
  const handleRerunInitiated = (newRunId: string, monthYear: string) => {
    setProgressDialogState({
      isOpen: true,
      runId: newRunId,
      monthYear: monthYear,
    });
  };

  const renderTabContent = () => {
    switch (currentTab) {
      case "process":
        return (
          <ProcessPayrollSection onPayrollRunSuccess={handleProcessingComplete} />
        );
      case "history":
        // CHANGE: Pass onRerunInitiated to the history section.
        return (
          <PayrollHistorySection
            refetchTrigger={refetchHistoryTrigger}
            onViewDetails={handleViewDetails}
            onRerunInitiated={handleRerunInitiated}
          />
        );
      case "reports":
        return <PayrollReportsSection />;
      case "details":
        return <PayrollRunDetailsView payrollRunId={selectedRunId} />;
      default:
        return null;
    }
  };

  const activeTabClasses = "border-b-2 border-[#7F5EFD] text-[#7F5EFD] font-semibold";
  const inactiveTabClasses = "text-gray-500 hover:text-gray-700";

  return (
    <div className="flex h-screen bg-gray-100">
      <SideNav />
      <div className="flex-1 flex flex-col overflow-hidden">
        <h1 className="text-3xl font-bold mb-4 mt-4 ml-4 text-gray-800">
          Payroll Management
        </h1>

        <div className="flex flex-1 flex-col p-4 md:p-6 overflow-hidden">
          <div className="flex space-x-4 border-b border-gray-200 mb-6">
            {[
              { id: "process", label: "Process Payroll" },
              { id: "history", label: "Payroll History" },
              { id: "reports", label: "Reports & Files" },
              { id: "details", label: "Run Details" },
            ].map((tab) => (
              <Button
                key={tab.id}
                variant="ghost"
                disabled={tab.id === "details" && !selectedRunId && currentTab !== "details"}
                className={cn(
                  "relative px-4 py-3 rounded-none transition-colors duration-200",
                  currentTab === tab.id
                    ? `${activeTabClasses} bg-purple-50`
                    : `${inactiveTabClasses} hover:bg-gray-100`,
                  tab.id === "details" && !selectedRunId && currentTab !== "details"
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                )}
                onClick={() => {
                  if (tab.id === "details" && !selectedRunId && currentTab !== "details") return;
                  setCurrentTab(tab.id as PayrollTab);
                }}
              >
                {tab.label}
              </Button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto bg-transparent rounded-md">
            {renderTabContent()}
          </div>
        </div>
      </div>
      {progressDialogState.isOpen && progressDialogState.runId && (
        <PayrollProgressDialog
          isOpen={progressDialogState.isOpen}
          onClose={(refetch) => {
            setProgressDialogState({ isOpen: false, runId: null, monthYear: "" });
            if (refetch) {
              handleProcessingComplete(true);
            }
          }}
          payrollRunId={progressDialogState.runId}
          payrollMonthYear={progressDialogState.monthYear}
          onProcessingComplete={handleProcessingComplete}
        />
      )}
    </div>
  );
};

export default PayrollPage;