// src/components/dashboard/payroll/PayrollProgressDialog.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Send,
  FileText,
  Users,
} from "lucide-react"; // Added Users
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";

import { API_BASE_URL } from "@/config";
import useAuthStore from "@/store/authStore";
import { toast } from "sonner";
import GenerateBulkFilesDialog from "./GenerateBulkFilesDialog"; // Import the new dialog

interface PayrollProgressDialogProps {
  isOpen: boolean;
  onClose: (triggerHistoryRefetchAfterBulkDialog?: boolean) => void;
  payrollRunId: string | null;
  payrollMonthYear: string;
  onProcessingComplete: (success: boolean, message?: string) => void;
}

interface ProgressDetails {
  stage: string;
  message: string;
  progress?: number;
  error?: string;
  failed_emails_count?: number;
  failed_emails_list?: { employee_id: string; email: string; reason: string }[];
  // Example: If backend sends total employees during calculation
  total_employees_to_process?: number;
}

interface PayrollStatusResponse {
  id: string;
  status: string;
  payrollMonth: string;
  progressDetails?: ProgressDetails;
  summary?: { totalNetPay: number | string };
}

const STAGE_ICONS: { [key: string]: React.ElementType } = {
  Initiated: Loader2,
  Calculating: Loader2,
  Calculation_Complete: CheckCircle,
  Sending_Payslips: Send,
  Payslips_Sent: CheckCircle,
  Processing_Failed: XCircle,
  Calculation_Failed: XCircle,
  Payslip_Sending_Failed: AlertTriangle,
  Failed: XCircle,
  default: Loader2,
};
const STAGE_COLORS: { [key: string]: string } = {
  Initiated: "text-blue-500",
  Calculating: "text-blue-500",
  Calculation_Complete: "text-green-500",
  Sending_Payslips: "text-blue-500",
  Payslips_Sent: "text-green-500",
  Processing_Failed: "text-red-500",
  Calculation_Failed: "text-red-500",
  Payslip_Sending_Failed: "text-orange-500",
  Failed: "text-red-500",
  default: "text-gray-500",
};
const FINAL_STAGES = [
  "Payslips_Sent",
  "Processing_Failed",
  "Calculation_Failed",
  "Payslip_Sending_Failed",
  "Calculation_Complete",
  "Failed",
];

interface GenerateBulkFilesDialogState {
  isOpen: boolean;
  payrollRunId: string | null;
  payrollMonthYear: string;
}

const PayrollProgressDialog: React.FC<PayrollProgressDialogProps> = ({
  isOpen,
  onClose,
  payrollRunId,
  payrollMonthYear,
  onProcessingComplete,
}) => {
  const { accessToken } = useAuthStore();
  const [currentStatus, setCurrentStatus] = useState<string | null>(null);
  const [progressDetails, setProgressDetails] =
    useState<ProgressDetails | null>(null);
  const [logMessages, setLogMessages] = useState<string[]>([]);
  const pollingIntervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const [isProcessComplete, setIsProcessComplete] = useState(false);
  const lastLoggedEmployeeCountRef = useRef<number>(0); // To track logging for employee processing

  const [generateBulkFilesDialogInfo, setGenerateBulkFilesDialogInfo] =
    useState<GenerateBulkFilesDialogState>({
      isOpen: false,
      payrollRunId: null,
      payrollMonthYear: "",
    });

  const fetchStatus = useCallback(async () => {
    if (!payrollRunId || !accessToken) return;

    try {
      const response = await axios.get<PayrollStatusResponse>(
        `${API_BASE_URL}/payroll/run-status/${payrollRunId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const data = response.data;
      setCurrentStatus(data.status);

      if (data.progressDetails) {
        const oldProgressDetails = progressDetails; // Keep a reference to old details for comparison
        setProgressDetails(data.progressDetails);
        const currentMessageTimestamped = `${new Date().toLocaleTimeString()}: ${
          data.progressDetails.message
        }`;

        const employeeProcessingPattern = /Processing employee (\d+) of (\d+):/;
        const match = data.progressDetails.message.match(
          employeeProcessingPattern
        );

        let shouldLogThisMessage = true;

        if (match) {
          const currentEmployeeCount = parseInt(match[1], 10);
          const totalEmployees =
            parseInt(match[2], 10) ||
            data.progressDetails.total_employees_to_process ||
            0;

          if (totalEmployees > 10) {
            // Only condense log if more than 30 employees
            // Log start, every 20%, and end for condensed view
            const progressPercentage =
              (currentEmployeeCount / totalEmployees) * 100;
            if (
              currentEmployeeCount === 1 ||
              currentEmployeeCount === totalEmployees ||
              Math.floor(progressPercentage / 20) >
                Math.floor(lastLoggedEmployeeCountRef.current / 20)
            ) {
              // Log this specific message
              lastLoggedEmployeeCountRef.current = progressPercentage;
            } else {
              shouldLogThisMessage = false; // Skip logging this specific "Processing employee X of Y"
            }
          }
          // If not skipping, update the general message to show overall progress
          if (
            data.progressDetails.message &&
            data.progressDetails.stage === "Calculating" &&
            totalEmployees > 0
          ) {
            // We can update a general "Calculating X/Y employees" message for the stage display instead of individual logs
            // For now, the main progress bar and stage message should cover this.
            // The log filtering above handles reducing spam.
          }
        }

        // Add to log only if it's a new message (or a significant employee processing step)
        if (
          shouldLogThisMessage &&
          (logMessages.length === 0 ||
            logMessages[logMessages.length - 1] !== currentMessageTimestamped)
        ) {
          // Prevent duplicate consecutive messages
          if (
            data.progressDetails &&
            !logMessages.find((log) =>
              log.endsWith(data.progressDetails!.message)
            )
          ) {
            setLogMessages((prev) => [...prev, currentMessageTimestamped]);
          }
        }
        // Update progressDetails even if not logging every message for UI elements that use it
        if (
          oldProgressDetails?.message !== data.progressDetails.message ||
          oldProgressDetails?.progress !== data.progressDetails.progress
        ) {
          setProgressDetails(data.progressDetails);
        }
      }

      if (FINAL_STAGES.includes(data.status) && !isProcessComplete) {
        // Ensure this block runs only once
        if (pollingIntervalIdRef.current)
          clearInterval(pollingIntervalIdRef.current);
        pollingIntervalIdRef.current = null;
        setIsProcessComplete(true); // Mark as complete to stop further processing here

        const success =
          data.status === "Payslips_Sent" ||
          data.status === "Calculation_Complete";
        onProcessingComplete(
          success,
          data.progressDetails?.message || data.status
        ); // Notify parent

        if (success) {
          toast.success(
            `Payroll for ${payrollMonthYear} processed: ${
              data.progressDetails?.message || data.status
            }`
          );
          setGenerateBulkFilesDialogInfo({
            isOpen: true,
            payrollRunId: payrollRunId,
            payrollMonthYear: payrollMonthYear,
          });
        } else if (data.status === "Payslip_Sending_Failed") {
          toast.warning(
            `Payroll for ${payrollMonthYear} processed with issues: ${
              data.progressDetails?.message || data.status
            }`
          );
        } else {
          toast.error(
            `Payroll for ${payrollMonthYear} failed: ${
              data.progressDetails?.error ||
              data.progressDetails?.message ||
              data.status
            }`
          );
        }
        // If processing failed, we can close this dialog and signal history refetch
        onClose(true); // true to refetch history to see the failed run
      }
    } catch (error) {
      console.error("Error fetching payroll status:", error);
      // Stop polling on critical error to prevent loop
      if (pollingIntervalIdRef.current)
        clearInterval(pollingIntervalIdRef.current);
      pollingIntervalIdRef.current = null;
      setProgressDetails((prev) => ({
        ...prev,
        stage: "Error",
        message: "Could not fetch payroll status.",
        error: (error as Error).message,
      }));
      toast.error("Failed to get payroll status update.");
    }
  }, [
    payrollRunId,
    accessToken,
    onProcessingComplete,
    payrollMonthYear,
    isProcessComplete /*,logMessages, progressDetails (removed to avoid loop with setProgressDetails) */,
  ]);

  useEffect(() => {
    if (isOpen && payrollRunId) {
      setLogMessages([
        `${new Date().toLocaleTimeString()}: Initiating payroll process for ${payrollMonthYear}...`,
      ]);
      setIsProcessComplete(false); // Reset completion status when dialog is (re)opened
      lastLoggedEmployeeCountRef.current = 0;
      setCurrentStatus(null); // Reset status
      setProgressDetails(null); // Reset details

      if (pollingIntervalIdRef.current) {
        // Clear any existing interval
        clearInterval(pollingIntervalIdRef.current);
        pollingIntervalIdRef.current = null;
      }

      fetchStatus(); // Initial fetch
      pollingIntervalIdRef.current = setInterval(fetchStatus, 3000); // Start new interval

      return () => {
        if (pollingIntervalIdRef.current) {
          clearInterval(pollingIntervalIdRef.current);
          pollingIntervalIdRef.current = null;
        }
      };
    } else if (!isOpen) {
      // Dialog closed externally
      if (pollingIntervalIdRef.current) {
        clearInterval(pollingIntervalIdRef.current);
        pollingIntervalIdRef.current = null;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, payrollRunId, accessToken, fetchStatus]); // fetchStatus is memoized

  const StageIcon = progressDetails?.stage
    ? STAGE_ICONS[progressDetails.stage] || STAGE_ICONS.default
    : STAGE_ICONS.default;
  const iconColor = progressDetails?.stage
    ? STAGE_COLORS[progressDetails.stage] || STAGE_COLORS.default
    : STAGE_COLORS.default;

  // This is called when THIS dialog needs to be closed.
  // It might be called by its own "Close" button, or after GenerateBulkFilesDialog is done.
  const handleThisDialogClose = (refetchHistory: boolean) => {
    if (pollingIntervalIdRef.current) {
      clearInterval(pollingIntervalIdRef.current);
      pollingIntervalIdRef.current = null;
    }
    onClose(refetchHistory); // Call the onClose passed from RunPayrollDialog
  };

  return (
    <>
      <Dialog
        open={isOpen && !generateBulkFilesDialogInfo.isOpen}
        onOpenChange={(open) => { 
            if(!open && !generateBulkFilesDialogInfo.isOpen) { // Only close if bulk dialog isn't the one active
                handleThisDialogClose(isProcessComplete && (currentStatus === 'Payslips_Sent' || currentStatus === 'Calculation_Complete'));
            }
        }}
      >
        <DialogContent className="sm:max-w-lg md:max-w-2xl lg:max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center">
              <FileText className="mr-3 h-7 w-7 text-[#7F5EFD]" />
              Processing Payroll for {payrollMonthYear}
            </DialogTitle>
            <DialogDescription>
              Track the progress of your payroll run. This may take a few
              moments.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 px-2 space-y-6 flex-1 overflow-y-auto">
            <div className="p-4 border rounded-lg shadow bg-slate-50">
              <div className="flex items-center mb-2">
                <StageIcon
                  className={`mr-3 h-8 w-8 ${iconColor} ${
                    progressDetails?.stage &&
                    STAGE_ICONS[progressDetails.stage] === Loader2
                      ? "animate-spin"
                      : ""
                  }`}
                />
                <div>
                  <p className={`text-xl font-semibold ${iconColor}`}>
                    {progressDetails?.stage
                      ? progressDetails.stage.replace(/_/g, " ")
                      : "Initializing..."}
                  </p>
                  <p className="text-sm text-gray-600">
                    {currentStatus
                      ? `Overall Status: ${currentStatus.replace(/_/g, " ")}`
                      : "Waiting for status..."}
                  </p>
                </div>
              </div>

              {progressDetails?.stage === "Calculating" &&
                progressDetails?.message.includes(" of ") && (
                  <div className="mt-3 mb-1">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>
                        <Users className="inline h-4 w-4 mr-1" />
                        {progressDetails?.message}
                      </span>
                      {progressDetails.progress !== undefined && (
                        <span>{progressDetails.progress.toFixed(0)}%</span>
                      )}
                    </div>
                    {progressDetails.progress !== undefined && (
                      <Progress
                        value={progressDetails.progress}
                        className="w-full [&>div]:bg-[#7F5EFD]"
                      />
                    )}
                  </div>
                )}
              {progressDetails?.stage !== "Calculating" &&
                progressDetails?.progress !== undefined &&
                progressDetails.progress >= 0 && (
                  <div className="mt-3 mb-1">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{progressDetails?.message || "Processing..."}</span>
                      <span>{progressDetails.progress.toFixed(0)}%</span>
                    </div>
                    <Progress
                      value={progressDetails.progress}
                      className="w-full [&>div]:bg-[#7F5EFD]"
                    />
                  </div>
                )}
              {(progressDetails?.progress === undefined ||
                progressDetails.progress < 0) &&
                progressDetails?.message &&
                progressDetails?.stage !== "Calculating" && (
                  <p className="text-sm text-gray-700 mt-1">
                    {progressDetails?.message}
                  </p>
                )}
            </div>

            {logMessages.length > 0 && (
              <div className="mt-4">
                <h3 className="text-md font-semibold mb-2 text-gray-700">
                  Activity Log:
                </h3>
                <ScrollArea className="h-[150px] md:h-[200px] w-full rounded-md border p-3 bg-gray-900 text-gray-200 font-mono text-xs">
                  {logMessages.map((msg, index) => (
                    <p
                      key={index}
                      className="whitespace-pre-wrap leading-relaxed"
                    >
                      {msg.includes("Failed") ||
                      msg.includes("Error") ||
                      msg.includes("failed") ? (
                        <span className="text-red-400">{msg}</span>
                      ) : msg.includes("Warning") || msg.includes("issues") ? (
                        <span className="text-yellow-400">{msg}</span>
                      ) : (
                        msg
                      )}
                    </p>
                  ))}
                </ScrollArea>
              </div>
            )}

            {progressDetails?.failed_emails_count &&
              progressDetails.failed_emails_count > 0 && (
                <div className="mt-4 p-3 border rounded-md bg-orange-50 border-orange-200">
                  <h3 className="text-md font-semibold text-orange-700 flex items-center">
                    <AlertTriangle className="mr-2 h-5 w-5" /> Payslip Emailing
                    Issues
                  </h3>
                  <p className="text-sm text-orange-600 mt-1">
                    {progressDetails.failed_emails_count} employee(s) did not
                    receive their payslip.
                  </p>
                  {progressDetails.failed_emails_list &&
                    progressDetails.failed_emails_list.length > 0 && (
                      <ScrollArea className="h-[100px] mt-2 text-xs text-orange-700">
                        <ul className="list-disc pl-5">
                          {progressDetails.failed_emails_list.map(
                            (item, idx) => (
                              <li key={idx}>
                                {" "}
                                Emp ID: {item.employee_id || "N/A"} - Email:{" "}
                                {item.email || "N/A"} - Reason: {item.reason}{" "}
                              </li>
                            )
                          )}
                        </ul>
                      </ScrollArea>
                    )}
                </div>
              )}
            {progressDetails?.error && (
              <div className="mt-4 p-3 border rounded-md bg-red-50 border-red-200">
                <h3 className="text-md font-semibold text-red-700 flex items-center">
                  <XCircle className="mr-2 h-5 w-5" /> An Error Occurred
                </h3>
                <p className="text-sm text-red-600 mt-1">
                  {progressDetails.error}
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="pt-4 border-t">
            <Button 
                variant="outline" 
                onClick={() => handleThisDialogClose(isProcessComplete && (currentStatus === 'Payslips_Sent' || currentStatus === 'Calculation_Complete'))} 
                className="w-full sm:w-auto"
            >
              {isProcessComplete && !generateBulkFilesDialogInfo.isOpen
                ? "Finish"
                : "Close (Processing in Background)"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {generateBulkFilesDialogInfo.payrollRunId && (
        <GenerateBulkFilesDialog
         isOpen={generateBulkFilesDialogInfo.isOpen}
          onClose={(refetchHistoryAfterBulk) => {
            // Changed param name for clarity
            setGenerateBulkFilesDialogInfo({
              isOpen: false,
              payrollRunId: null,
              payrollMonthYear: "",
            });
            // When GenerateBulkFilesDialog closes, it signals whether to refetch history.
            // This also implies the main ProgressDialog should close.
           handleThisDialogClose(refetchHistoryAfterBulk);
          }}
          payrollRunId={generateBulkFilesDialogInfo.payrollRunId}
          payrollMonthYear={generateBulkFilesDialogInfo.payrollMonthYear}
        />
      )}
    </>
  );
};

export default PayrollProgressDialog;
