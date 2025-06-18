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
 const { handleSubmit, reset, setValue } = useForm<RunPayrollFormInputs>();

  const [isSubmitting, setIsSubmitting] = useState(false);

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
      //setFormError(null);
    }
  }, [isOpen, reset, currentMonth, currentYear]);

  const onSubmit: SubmitHandler<RunPayrollFormInputs> = async (data) => {
    if (!accessToken) {
      toast.error("Authentication token missing. Please log in again.");
      return;
    }

    setIsSubmitting(true);
    //setFormError(null);
    setCurrentPayrollMonthYear(`${data.payrollMonth} ${data.payrollYear}`); // For display in progress dialog

    try {
      // Use the new endpoint
       const response = await axios.post<InitiateRunResponse>(
        `${API_BASE_URL}/payroll/calculate-run`,
        data,
        { headers: { Authorization: `Bearer ${accessToken}` } }
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
      //setFormError(errorMessage);
      toast.error(errorMessage, { id: 'initiate-payroll-error' });
      setIsSubmitting(false);
    }
  };

  // This function is called when the progress dialog is finally closed.
  const handleProcessingComplete = (success: boolean) => {
    setIsProgressDialogOpen(false);
    setCurrentPayrollRunId(null);
    onPayrollRunSuccess(success); // Notify the parent page (PayrollPage)
  };

  return (
    <>
     <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Run New Payroll</DialogTitle>
            <DialogDescription>Select the month and year to start the payroll calculation process.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 py-4">
            <div className="grid grid-cols-1 gap-3">
              <Label htmlFor="payrollMonth">Payroll Month</Label>
              <Select onValueChange={(value) => setValue("payrollMonth", value)} defaultValue={currentMonth}>
                <SelectTrigger id="payrollMonth" className="w-full">
                  <SelectValue placeholder="Select Month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (<SelectItem key={month} value={month}>{month}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <Label htmlFor="payrollYear">Payroll Year</Label>
              <Select onValueChange={(value) => setValue("payrollYear", value)} defaultValue={currentYear}>
                <SelectTrigger id="payrollYear" className="w-full">
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (<SelectItem key={year} value={year}>{year}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="mt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-[#7F5EFD] hover:bg-[#6a4fcf]">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isSubmitting ? "Initiating..." : "Start Process"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Payroll Progress Dialog is now controlled from here */}
      {isProgressDialogOpen && currentPayrollRunId && (
        <PayrollProgressDialog
          isOpen={isProgressDialogOpen}
          onClose={(refetch) => {
             setIsProgressDialogOpen(false);
             if(refetch) {
                onPayrollRunSuccess(true);
             }
          }}
          payrollRunId={currentPayrollRunId}
          payrollMonthYear={currentPayrollMonthYear}
          onProcessingComplete={handleProcessingComplete}
        />
      )}
    </>
  );
};

export default RunPayrollDialog;
