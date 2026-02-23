// src/components/company/payroll/deductions/EditDeductionDialog.tsx

import { useState, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { API_BASE_URL } from "@/config";
import { useAuthStore } from "@/stores/authStore";
import { AssignedDeduction } from "./DeductionAssignTable";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { BorderFloatingField } from "@/components/company/employees/employeeutils";

type Props = {
  deduction: AssignedDeduction;
  companyId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
};

export default function EditDeductionDialog({
  deduction,
  companyId,
  isOpen,
  onClose,
  onUpdated,
}: Props) {
  const { session } = useAuthStore();
  const [loading, setLoading] = useState(false);

  // Form states
  const [value, setValue] = useState(deduction.value.toString());
  const [calculationType, setCalculationType] = useState<"FIXED" | "PERCENTAGE">(
    deduction.calculation_type
  );
  const [isRecurring, setIsRecurring] = useState(deduction.is_recurring);
  const [startDate, setStartDate] = useState(deduction.start_date);
  const [numberOfMonths, setNumberOfMonths] = useState(
    deduction.number_of_months?.toString() || ""
  );
  const [endDate, setEndDate] = useState(deduction.end_date || "");

  // Calculate end date when number of months changes
  useEffect(() => {
    if (!isRecurring && startDate && numberOfMonths) {
      const start = new Date(startDate);
      start.setMonth(start.getMonth() + parseInt(numberOfMonths));
      setEndDate(start.toISOString().split("T")[0]);
    }
  }, [isRecurring, startDate, numberOfMonths]);

  // Reset end date when switching to recurring
  useEffect(() => {
    if (isRecurring) {
      setEndDate("");
    }
  }, [isRecurring]);

  const validateForm = () => {
    if (!value || Number(value) <= 0) {
      toast.error("Please enter a valid value");
      return false;
    }
    if (!startDate) {
      toast.error("Please select a start date");
      return false;
    }
    return true;
  };

  const handleUpdate = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const payload = {
        value: parseFloat(value),
        calculation_type: calculationType,
        is_recurring: isRecurring,
        start_date: startDate,
        number_of_months: !isRecurring && numberOfMonths ? parseInt(numberOfMonths) : null,
        metadata: {},
      };

      const response = await fetch(
        `${API_BASE_URL}/company/${companyId}/deductions/${deduction.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update deduction");
      }

      toast.success("Deduction updated successfully");
      onUpdated();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to update deduction");
    } finally {
      setLoading(false);
    }
  };

  // Helper to get recipient display
  const getRecipientDisplay = () => {
    switch (deduction.applies_to) {
      case "INDIVIDUAL":
        return deduction.employees
          ? `${deduction.employees.first_name} ${deduction.employees.last_name} (${deduction.employees.employee_number})`
          : "Unknown Employee";
      case "COMPANY":
        return "All Employees (Company-wide)";
      case "DEPARTMENT":
        return deduction.departments?.name || "Unknown Department";
      case "SUB_DEPARTMENT":
        return deduction.sub_departments?.name || "Unknown Sub-department";
      case "JOB_TITLE":
        return deduction.job_titles?.title || "Unknown Job Title";
      default:
        return "N/A";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl rounded-lg border-slate-200 p-0 gap-0 shadow-lg">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100">
          <DialogTitle className="text-lg font-semibold text-slate-900">
            Edit Deduction
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500 mt-1">
            Update the deduction details below
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Read-only fields - styled as info cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Deduction Type
              </Label>
              <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "text-xs font-medium",
                    deduction.deduction_types.is_pre_tax 
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-slate-50 text-slate-600 border border-slate-200"
                  )}
                >
                  {deduction.deduction_types.is_pre_tax ? "Pre-tax" : "Post-tax"}
                </Badge>
                <span className="text-sm font-medium text-slate-900">
                  {deduction.deduction_types.name}
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Assigned To
              </Label>
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center flex-wrap gap-1">
                  <span className="text-sm text-slate-700">{getRecipientDisplay()}</span>
                  {deduction.applies_to !== "INDIVIDUAL" && 
                   deduction.applies_to !== "COMPANY" && (
                    <Badge variant="outline" className="text-xs border-slate-300">
                      {deduction.applies_to.replace("_", " ")}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Pre-tax info */}
          {deduction.deduction_types.is_pre_tax && (
            <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
              <Info className="h-4 w-4 text-amber-700 mt-0.5" />
              <p className="text-xs text-amber-700">
                This is a pre-tax deduction. It will be deducted before tax calculation.
              </p>
            </div>
          )}

          {/* Value and Calculation Type */}
          <div className="grid grid-cols-2 gap-4">
            <BorderFloatingField
              label={calculationType === "PERCENTAGE" ? "Percentage %" : "Amount (KES)"}
              type="number"
              //step={calculationType === "PERCENTAGE" ? "0.01" : "1"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
            />
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Calculation Type *</Label>
              <div className="flex gap-2 p-1 bg-slate-50 rounded-lg border border-slate-200">
                <Button
                  type="button"
                  variant={calculationType === "FIXED" ? "default" : "ghost"}
                  onClick={() => setCalculationType("FIXED")}
                  className={cn(
                    "flex-1 h-9 text-sm font-medium rounded-md transition-all",
                    calculationType === "FIXED"
                      ? "bg-white text-slate-900 border border-slate-300 shadow-sm hover:bg-white"
                      : "bg-transparent text-slate-500 hover:bg-white hover:text-slate-900 border-transparent"
                  )}
                >
                  Fixed
                </Button>
                <Button
                  type="button"
                  variant={calculationType === "PERCENTAGE" ? "default" : "ghost"}
                  onClick={() => setCalculationType("PERCENTAGE")}
                  className={cn(
                    "flex-1 h-9 text-sm font-medium rounded-md transition-all",
                    calculationType === "PERCENTAGE"
                      ? "bg-white text-slate-900 border border-slate-300 shadow-sm hover:bg-white"
                      : "bg-transparent text-slate-500 hover:bg-white hover:text-slate-900 border-transparent"
                  )}
                >
                  Percentage
                </Button>
              </div>
            </div>
          </div>

          {/* Recurring Switch */}
          <div className="flex items-center justify-between border border-slate-200 rounded-lg p-4 bg-white">
            <div className="space-y-0.5">
              <Label htmlFor="is-recurring" className="text-sm font-medium text-slate-700">
                Recurring Deduction
              </Label>
              <p className="text-xs text-slate-500">
                {isRecurring
                  ? "This deduction will continue indefinitely"
                  : "This deduction will end after a specified period"}
              </p>
            </div>
            <Switch
              id="is-recurring"
              checked={isRecurring}
              onCheckedChange={setIsRecurring}
              className="data-[state=checked]:bg-[#1F3A8A]"
            />
          </div>

          {/* Date Fields */}
          <div className="space-y-4">
            <BorderFloatingField
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />

            {!isRecurring && (
              <>
                <BorderFloatingField
                  label="Number of Months"
                  type="number"
                  value={numberOfMonths}
                  onChange={(e) => setNumberOfMonths(e.target.value)}
                />
                {endDate && (
                  <Alert className="border-blue-200 bg-blue-50/80">
                    <Info className="h-4 w-4 text-blue-700" />
                    <AlertDescription className="text-xs text-blue-700">
                      This deduction will end on{" "}
                      <span className="font-medium">
                        {new Date(endDate).toLocaleDateString("en-KE", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </div>
        </div>

        <DialogFooter className="p-6 pt-4 border-t border-slate-100 bg-slate-50/50">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="border-slate-300 text-slate-700 hover:bg-slate-100 rounded-md h-10 px-6"
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={loading}
            className="bg-[#1F3A8A] hover:bg-[#162a63] px-6 rounded-md h-10 text-sm font-medium shadow-sm min-w-35"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Updating...</span>
              </div>
            ) : (
              "Update Deduction"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}