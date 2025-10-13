// src/components/company/payroll/allowances/EditAllowanceDialog.tsx

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { API_BASE_URL } from "@/config";
import { useAuthStore } from "@/stores/authStore";
import { Allowance } from "./AllowanceAssignTable";
import { toast } from "sonner";

type Props = {
  allowance: Allowance;
  companyId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
};

// Standard month list for uniform spelling/dropdowns
const MONTHS = [
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

// Generate years for dropdown
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => String(currentYear + i));

export default function EditAllowanceDialog({
  allowance,
  companyId,
  isOpen,
  onClose,
  onUpdated,
}: Props) {
  const { session } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const [value, setValue] = useState(allowance.value.toString());
  const [calculationType, setCalculationType] = useState<
    "Fixed" | "Percentage"
  >(allowance.calculation_type);
  const [isRecurring, setIsRecurring] = useState(allowance.is_recurring);
  const [startMonth, setStartMonth] = useState<string>(allowance.start_month);
  const [startYear, setStartYear] = useState<string>(
    String(allowance.start_year)
  );
  const [endMonth, setEndMonth] = useState<string | null>(allowance.end_month);
  const [endYear, setEndYear] = useState<string | null>(
    allowance.end_year ? String(allowance.end_year) : null
  );
  const handleUpdate = async () => {
    if (!value || !startMonth || !startYear) {
      toast.error("Please fill in all required fields.");
      return;
    }

    // --- UPDATED LOGIC: Map internal state to API payload ---
    const apiEndMonth = endMonth === "ONGOING_PERIOD" ? null : endMonth;
    const apiEndYear = endYear === "ONGOING_PERIOD" ? null : endYear;

    // Re-check validation based on actual API payload values
    if (
      isRecurring &&
      ((apiEndMonth && !apiEndYear) || (apiEndYear && !apiEndMonth))
    ) {
      toast.error(
        "Please select both a month and a year for the End Period, or neither."
      );
      return;
    }
    setLoading(true);

    try {
      const payload = {
        value: parseFloat(value),
        calculation_type: calculationType,
        is_recurring: isRecurring,
        start_month: startMonth,
        start_year: parseInt(startYear),
        end_month: apiEndMonth,
        end_year: apiEndYear ? parseInt(apiEndYear) : null,
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
        throw new Error("Failed to update allowance");
      }

      toast.success("Allowance updated successfully.");

      onUpdated();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update allowance. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Allowance</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2 pb-4">
          <div className="space-y-2">
            <Label>Allowance Type</Label>
            <Input disabled value={allowance.allowance_types.name} />
          </div>
          <div className="space-y-2">
            <Label>Employee</Label>
            <Input
              disabled
              value={`${allowance.employees.first_name} ${allowance.employees.last_name}`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="value">Value</Label>
              <Input
                id="value"
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Calculation Type</Label>
              <RadioGroup
                value={calculationType}
                onValueChange={(val: "Fixed" | "Percentage") =>
                  setCalculationType(val)
                }
                className="flex h-10 items-center space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Fixed" id="fixed" />
                  <Label htmlFor="fixed">Fixed</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Percentage" id="percentage" />
                  <Label htmlFor="percentage">Percentage</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* Recurring and Period Selection */}
          <div className="space-y-4 rounded-md border p-4">
            <h3 className="text-md font-semibold mb-2">Allowance Period</h3>

            {/* Is Recurring Switch */}
            <div className="flex items-center justify-between space-x-2 pt-2">
              <Label htmlFor="is-recurring">Is Recurring?</Label>
              <Switch
                id="is-recurring"
                checked={isRecurring}
                onCheckedChange={setIsRecurring}
              />
            </div>

            {/* Start Period */}
            <div className="grid grid-cols-2 gap-4">
              {/* Start Month */}
              <div>
                <Label htmlFor="start-month">Start Month</Label>
                <Select value={startMonth} onValueChange={setStartMonth}>
                  <SelectTrigger id="start-month" className="w-full">
                    <SelectValue placeholder="Select Month" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Months</SelectLabel>
                      {MONTHS.map((month) => (
                        <SelectItem key={month} value={month}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {/* Start Year */}
              <div>
                <Label htmlFor="start-year">Start Year</Label>
                <Select value={startYear} onValueChange={setStartYear}>
                  <SelectTrigger id="start-year" className="w-full">
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Years</SelectLabel>
                      {YEARS.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* End Period (Conditional on Is Recurring) */}
            {isRecurring && (
              <div className="grid grid-cols-2 gap-4">
                {/* End Month */}
                <div>
                  <Label htmlFor="end-month">End Month (Optional)</Label>
                  <Select
                    // Use 'ONGOING_PERIOD' string for null/no selection
                    value={endMonth || "ONGOING_PERIOD"}
                    onValueChange={(val) =>
                      setEndMonth(val === "ONGOING_PERIOD" ? null : val)
                    }
                  >
                    <SelectTrigger id="end-month" className="w-full">
                      <SelectValue placeholder="No End Month (Ongoing)" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Change value from "" to "ONGOING_PERIOD" */}
                      <SelectItem value="ONGOING_PERIOD">
                        No End Month (Ongoing)
                      </SelectItem>
                      <SelectGroup>
                        <SelectLabel>Months</SelectLabel>
                        {MONTHS.map((month) => (
                          <SelectItem key={month} value={month}>
                            {month}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                {/* End Year */}
                <div>
                  <Label htmlFor="end-year">End Year (Optional)</Label>
                  <Select
                    // Use 'ONGOING_PERIOD' string for null/no selection
                    value={endYear || "ONGOING_PERIOD"}
                    onValueChange={(val) =>
                      setEndYear(val === "ONGOING_PERIOD" ? null : val)
                    }
                    // Disabled check uses the internal state, which is 'ONGOING_PERIOD' if null
                    disabled={
                      endMonth === null || endMonth === "ONGOING_PERIOD"
                    }
                  >
                    <SelectTrigger id="end-year" className="w-full">
                      <SelectValue placeholder="No End Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Change value from "" to "ONGOING_PERIOD" */}
                      <SelectItem value="ONGOING_PERIOD">
                        No End Year
                      </SelectItem>
                      <SelectGroup>
                        <SelectLabel>Years</SelectLabel>
                        {YEARS.map((year) => (
                          <SelectItem key={year} value={year}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="bg-[#7F5EFD] text-white hover:bg-[#6a4ad3]"
            onClick={handleUpdate}
            disabled={loading}
          >
            {loading ? "Updating..." : "Update Allowance"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
