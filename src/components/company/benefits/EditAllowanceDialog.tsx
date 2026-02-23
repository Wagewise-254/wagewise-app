// src/components/company/payroll/allowances/EditAllowanceDialog.tsx

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { API_BASE_URL } from "@/config";
import { useAuthStore } from "@/stores/authStore";
import { Allowance } from "./AllowanceAssignTable";
import { toast } from "sonner";
import { BorderFloatingField } from "@/components/company/employees/employeeutils";

type Props = {
  allowance: Allowance;
  companyId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
};

type HousingMetadata = {
  type: "ordinary" | "farm" | "service_director";
  is_employer_owned?: boolean;
  rent_paid_to_employer?: number;
};

type CarMetadata = {
  engine_cc: number;
};

export default function EditAllowanceDialog({
  allowance,
  companyId,
  isOpen,
  onClose,
  onUpdated,
}: Props) {
  const { session } = useAuthStore();
  const [loading, setLoading] = useState(false);

  // Form states
  const [value, setValue] = useState(allowance.value.toString());
  const [calculationType, setCalculationType] = useState<"FIXED" | "PERCENTAGE">(
    allowance.calculation_type
  );
  const [isRecurring, setIsRecurring] = useState(allowance.is_recurring);
  const [startDate, setStartDate] = useState(allowance.start_date);
  const [numberOfMonths, setNumberOfMonths] = useState(
    allowance.number_of_months?.toString() || ""
  );
  const [endDate, setEndDate] = useState(allowance.end_date || "");

  // Metadata states
  const [housingMetadata, setHousingMetadata] = useState<HousingMetadata>(() => {
    if (allowance.allowance_types?.code === "HOUSING") {
      const metadata = allowance.metadata;
      if (metadata && 'type' in metadata) {
        return metadata as HousingMetadata;
      }
    }
    return { 
      type: "ordinary",
      is_employer_owned: false,
      rent_paid_to_employer: 0
    };
  });
  
  const [carMetadata, setCarMetadata] = useState<CarMetadata>(() => {
    if (allowance.allowance_types?.code === "CAR") {
      const metadata = allowance.metadata;
      if (metadata && 'engine_cc' in metadata) {
        return metadata as CarMetadata;
      }
    }
    return { engine_cc: 0 };
  });

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

  const getMetadata = () => {
    if (!allowance.allowance_types) return {};

    switch (allowance.allowance_types.code) {
      case "HOUSING":
        return housingMetadata;
      case "CAR":
        return carMetadata;
      default:
        return {};
    }
  };

  const validateForm = () => {
    if (!value || Number(value) <= 0) {
      toast.error("Please enter a valid value");
      return false;
    }
    if (!startDate) {
      toast.error("Please select a start date");
      return false;
    }

    // Validate housing metadata
    if (allowance.allowance_types?.code === "HOUSING") {
      if (
        housingMetadata.type === "ordinary" &&
        housingMetadata.is_employer_owned === false &&
        (!housingMetadata.rent_paid_to_employer ||
          housingMetadata.rent_paid_to_employer <= 0)
      ) {
        toast.error("Please enter the rent paid to employer for rented housing");
        return false;
      }
    }

    // Validate car metadata
    if (
      allowance.allowance_types?.code === "CAR" &&
      (!carMetadata.engine_cc || carMetadata.engine_cc <= 0)
    ) {
      toast.error("Please enter the car's engine capacity (CC)");
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
        metadata: getMetadata(),
      };

      const response = await fetch(
        `${API_BASE_URL}/company/${companyId}/allowances/${allowance.id}`,
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
        throw new Error(error.error || "Failed to update allowance");
      }

      toast.success("Allowance updated successfully");
      onUpdated();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to update allowance");
    } finally {
      setLoading(false);
    }
  };

  const getRecipientDisplay = () => {
    switch (allowance.applies_to) {
      case "INDIVIDUAL":
        return allowance.employees
          ? `${allowance.employees.first_name} ${allowance.employees.last_name} (${allowance.employees.employee_number})`
          : "Unknown Employee";
      case "COMPANY":
        return "All Employees (Company-wide)";
      case "DEPARTMENT":
        return allowance.departments?.name || "Unknown Department";
      case "SUB_DEPARTMENT":
        return allowance.sub_departments?.name || "Unknown Sub-department";
      case "JOB_TITLE":
        return allowance.job_titles?.title || "Unknown Job Title";
      default:
        return "N/A";
    }
  };

  const renderMetadataFields = () => {
    if (!allowance.allowance_types) return null;

    switch (allowance.allowance_types.code) {
      case "HOUSING":
        return (
          <div className="space-y-4 rounded-lg border border-slate-200 p-4 bg-white">
            <h3 className="text-sm font-semibold text-slate-900">Housing Details</h3>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Housing Type</Label>
              <Select
                value={housingMetadata.type}
                onValueChange={(value: "ordinary" | "farm" | "service_director") =>
                  setHousingMetadata({ ...housingMetadata, type: value })
                }
              >
                <SelectTrigger className="border-slate-200 h-10">
                  <SelectValue placeholder="Select housing type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ordinary">Ordinary</SelectItem>
                  <SelectItem value="farm">Farm</SelectItem>
                  <SelectItem value="service_director">Service Director</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {housingMetadata.type === "ordinary" && (
              <>
                <div className="flex items-center justify-between border border-slate-200 rounded-lg p-4 bg-white">
                  <div className="space-y-0.5">
                    <Label htmlFor="employer-owned" className="text-sm font-medium text-slate-700">
                      Is Employer Owned?
                    </Label>
                    <p className="text-xs text-slate-500">
                      Toggle if the housing is owned by the employer
                    </p>
                  </div>
                  <Switch
                    id="employer-owned"
                    checked={housingMetadata.is_employer_owned || false}
                    onCheckedChange={(checked) =>
                      setHousingMetadata({
                        ...housingMetadata,
                        is_employer_owned: checked,
                        rent_paid_to_employer: checked ? 0 : housingMetadata.rent_paid_to_employer,
                      })
                    }
                    className="data-[state=checked]:bg-[#1F3A8A]"
                  />
                </div>

                {!housingMetadata.is_employer_owned && (
                  <BorderFloatingField
                    label="Rent Paid to Employer (per month)"
                    type="number"
                    value={housingMetadata.rent_paid_to_employer || ""}
                    onChange={(e) =>
                      setHousingMetadata({
                        ...housingMetadata,
                        rent_paid_to_employer: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                )}
              </>
            )}
            
            {housingMetadata.type !== "ordinary" && (
              <div className="bg-blue-50/80 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700 flex items-center gap-2">
                  <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  {housingMetadata.type === "farm" 
                    ? "Farm housing benefits have special tax considerations"
                    : "Service director housing follows specific KRA guidelines"}
                </p>
              </div>
            )}
          </div>
        );

      case "CAR":
        return (
          <div className="space-y-4 rounded-lg border border-slate-200 p-4 bg-white">
            <h3 className="text-sm font-semibold text-slate-900">Car Details</h3>
            <BorderFloatingField
              label="Engine Capacity (CC)"
              type="number"
              value={carMetadata.engine_cc || ""}
              onChange={(e) =>
                setCarMetadata({
                  engine_cc: parseFloat(e.target.value) || 0,
                })
              }
            />
            <div className="bg-blue-50/80 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700 flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full" />
                Engine capacity determines the taxable benefit value
              </p>
            </div>
          </div>
        );

      case "MEAL":
        return (
          <Alert className="border-amber-200 bg-amber-50/80">
            <AlertCircle className="h-4 w-4 text-amber-700" />
            <AlertDescription className="text-xs text-amber-700">
              First KES 5,000 is tax-exempt. Excess amounts are taxable
            </AlertDescription>
          </Alert>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl rounded-lg border-slate-200 p-0 gap-0 shadow-lg">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100">
          <DialogTitle className="text-lg font-semibold text-slate-900">
            Edit Allowance
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500 mt-1">
            Update the allowance details below
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Read-only fields - styled as info cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Allowance Type
              </Label>
              <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                <span className={cn(
                  "text-xs font-medium px-2 py-0.5 rounded-md",
                  allowance.allowance_types?.is_cash
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-purple-50 text-purple-700 border border-purple-200"
                )}>
                  {allowance.allowance_types?.is_cash ? "Cash" : "Non-Cash"}
                </span>
                <span className="text-sm font-medium text-slate-900">
                  {allowance.allowance_types?.name || "N/A"}
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Recipient
              </Label>
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-sm text-slate-700">{getRecipientDisplay()}</p>
              </div>
            </div>
          </div>

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
                Recurring Allowance
              </Label>
              <p className="text-xs text-slate-500">
                {isRecurring
                  ? "This allowance will continue indefinitely"
                  : "This allowance will end after a specified period"}
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
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <p className="text-sm text-slate-600">
                      <span className="font-medium">End Date:</span>{" "}
                      {new Date(endDate).toLocaleDateString("en-KE", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Metadata Fields */}
          {renderMetadataFields()}
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
              "Update Allowance"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}