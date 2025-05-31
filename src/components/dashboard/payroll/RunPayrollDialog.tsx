// src/components/dashboard/payroll/RunPayrollDialog.tsx

import React, { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import axios from "axios";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// Import Shadcn UI components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { API_BASE_URL } from "@/config";
import useAuthStore from "@/store/authStore";

// Import the new Progress Dialog
import PayrollProgressDialog from "./PayrollProgressDialog";

interface RunPayrollDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPayrollRunSuccess: (success: boolean, message?: string) => void; // This will be passed to PayrollProgressDialog
}

interface RunPayrollFormInputs {
  payrollMonth: string;
  payrollYear: string;
}

interface InitiateRunResponse {
  message: string;
  payrollRunId: string;
}

const RunPayrollDialog: React.FC<RunPayrollDialogProps> = ({
  isOpen,
  onClose,
  onPayrollRunSuccess,
}) => {
  const { accessToken } = useAuthStore();
  const {
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<RunPayrollFormInputs>();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // State for the new Progress Dialog
  const [isProgressDialogOpen, setIsProgressDialogOpen] = useState(false);
  const [currentPayrollRunId, setCurrentPayrollRunId] = useState<string | null>(
    null
  );
  const [currentPayrollMonthYear, setCurrentPayrollMonthYear] =
    useState<string>("");

  const currentMonth = new Date().toLocaleString("default", { month: "long" });
  const currentYear = new Date().getFullYear().toString();

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const years = Array.from({ length: 11 }, (_, i) =>
    (new Date().getFullYear() - 5 + i).toString()
  ).sort((a, b) => parseInt(b) - parseInt(a));

  useEffect(() => {
    if (isOpen) {
      reset({
        payrollMonth: currentMonth,
        payrollYear: currentYear,
      });
      setFormError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, reset, currentMonth, currentYear]);

  const onSubmit: SubmitHandler<RunPayrollFormInputs> = async (data) => {
    if (!accessToken) {
      toast.error("Authentication token missing. Please log in again.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setCurrentPayrollMonthYear(`${data.payrollMonth} ${data.payrollYear}`); // For display in progress dialog

    try {
      // Use the new endpoint
      const response = await axios.post<InitiateRunResponse>(
        `${API_BASE_URL}/payroll/initiate-run`,
        data,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      toast.info(
        response.data.message ||
          "Payroll initiation accepted. Starting process..."
      );
      setCurrentPayrollRunId(response.data.payrollRunId);
      onClose(); // Close this dialog
      setIsProgressDialogOpen(true); // Open the progress dialog
    } catch (err: unknown) {
      console.error("Error initiating payroll:", err);
      let errorMessage = "Failed to initiate payroll.";
      if (axios.isAxiosError(err) && err.response?.data) {
        const backendError = err.response.data as {
          error?: string;
          message?: string;
        };
        errorMessage =
          backendError.error || backendError.message || errorMessage;
        if (err.response.status === 409 && backendError.error) {
          // Conflict error
          errorMessage = backendError.error; // Use the specific conflict message
        }
      }
      setFormError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProcessingComplete = (
    success: boolean,
    finalMessage?: string
  ) => {
    setIsProgressDialogOpen(false); // Close progress dialog
    setCurrentPayrollRunId(null);
    onPayrollRunSuccess(success, finalMessage);
    // Toasts for final status are handled within PayrollProgressDialog
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[450px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl text-gray-800">
              Run New Payroll
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Select the month and year to start processing payroll.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 py-4">
            <div className="grid grid-cols-1 gap-3">
              <Label
                htmlFor="payrollMonth"
                className="text-sm font-medium text-gray-700"
              >
                Payroll Month
              </Label>
              <Select
                onValueChange={(value) =>
                  setValue("payrollMonth", value, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
                value={watch("payrollMonth") || currentMonth} // Ensure a value is always present
                name="payrollMonth"
              >
                <SelectTrigger
                  id="payrollMonth"
                  className="w-full border-gray-300 focus:border-[#7F5EFD] focus:ring-[#7F5EFD]"
                >
                  <SelectValue placeholder="Select Month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem
                      key={month}
                      value={month}
                      className="hover:bg-gray-100"
                    >
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.payrollMonth && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.payrollMonth.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3">
              <Label
                htmlFor="payrollYear"
                className="text-sm font-medium text-gray-700"
              >
                Payroll Year
              </Label>
              <Select
                onValueChange={(value) =>
                  setValue("payrollYear", value, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
                value={watch("payrollYear") || currentYear} // Ensure a value is always present
                name="payrollYear"
              >
                <SelectTrigger
                  id="payrollYear"
                  className="w-full border-gray-300 focus:border-[#7F5EFD] focus:ring-[#7F5EFD]"
                >
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem
                      key={year}
                      value={year}
                      className="hover:bg-gray-100"
                    >
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.payrollYear && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.payrollYear.message}
                </p>
              )}
            </div>

            {formError && (
              <p className="text-red-600 text-sm text-center bg-red-100 p-2 rounded-md">
                {formError}
              </p>
            )}

            <DialogFooter className="mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !isDirty}
                className="bg-[#7F5EFD] hover:bg-[#6a4fcf] text-white"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {isSubmitting ? "Initiating..." : "Start Payroll Process"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Payroll Progress Dialog */}
      {isProgressDialogOpen && currentPayrollRunId && (
        <PayrollProgressDialog
          isOpen={isProgressDialogOpen}
          // This onClose for PayrollProgressDialog will be called by its internal logic 
          // (e.g., when GenerateBulkFilesDialog itself is closed or if user closes progress dialog early)
          onClose={(triggerHistoryRefetch) => {
            setIsProgressDialogOpen(false); // Close the progress dialog itself
            // If history refetch is signaled (typically after GenerateBulkFiles is done),
            // call the main success handler.
            // This assumes the 'success' status is implicitly true if refetch is triggered from a successful flow.
            // The onProcessingComplete from PayrollProgressDialog is the primary signal.
            if (triggerHistoryRefetch) {
              handleProcessingComplete(true, "Process viewed, history updated.");
            } else {
              // If closed early or without specific success signal for history,
              // might not call the full success handler or call it with a different status.
              // For simplicity, we rely on onProcessingComplete.
            }
          }}
          payrollRunId={currentPayrollRunId}
          payrollMonthYear={currentPayrollMonthYear}
          // This onProcessingComplete is called by PayrollProgressDialog *before* it shows GenerateBulkFilesDialog (if successful)
          // OR if it fails. We need to pass the main callback here.
          onProcessingComplete={handleProcessingComplete}
        />
      )}
    </>
  );
};

export default RunPayrollDialog;
