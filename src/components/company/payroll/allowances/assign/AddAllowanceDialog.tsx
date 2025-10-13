// src/components/company/payroll/allowances/AddAllowanceDialog.tsx

import { useState, useEffect } from "react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { API_BASE_URL } from "@/config";
import { useAuthStore } from "@/stores/authStore";
//import { Allowance } from "./AllowanceAssignTable"; // Assuming you will use this type
import { AllowanceType } from "@/components/company/payroll/allowances/manage/AllowanceManageTable"; // Assuming you have this type
import { toast } from "sonner";

type Props = {
  companyId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
};

// Assuming you have an Employee type
type Employee = {
  id: string;
  first_name: string;
  last_name: string;
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
const YEARS = Array.from({ length: 5 }, (_, i) => String(currentYear + i)); // Current year + next 4

// Helper to get current month name
const getCurrentMonthName = () => {
  return MONTHS[new Date().getMonth()];
};

export default function AddAllowanceDialog({
  companyId,
  isOpen,
  onClose,
  onUpdated,
}: Props) {
  const { session } = useAuthStore();
  const [loading, setLoading] = useState(false);

  // Form states
  const [allowanceTypeId, setAllowanceTypeId] = useState<string>("");
  const [employeeId, setEmployeeId] = useState<string>("");
  const [value, setValue] = useState<string>("");
  const [calculationType, setCalculationType] = useState<
    "Fixed" | "Percentage"
  >("Fixed");
  const [isRecurring, setIsRecurring] = useState(true);
  const [startMonth, setStartMonth] = useState<string>(getCurrentMonthName());
  const [startYear, setStartYear] = useState<string>(String(currentYear));
  const [endMonth, setEndMonth] = useState<string | null>(null);
  const [endYear, setEndYear] = useState<string | null>(null);
  // Data for select components
  const [allowanceTypes, setAllowanceTypes] = useState<AllowanceType[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // State for popovers
  const [openAllowanceType, setOpenAllowanceType] = useState(false);
  const [openEmployee, setOpenEmployee] = useState(false);

  useEffect(() => {
    // Fetch allowance types
    const fetchAllowanceTypes = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/company/${companyId}/allowance-types`,
          {
            headers: {
              Authorization: `Bearer ${session?.access_token}`,
            },
          }
        );
        const data = await response.json();
        setAllowanceTypes(data);
      } catch (err) {
        console.error("Failed to fetch allowance types", err);
      }
    };

    // Fetch employees
    const fetchEmployees = async () => {
      // NOTE: Assuming an endpoint exists to get employees for the company
      try {
        const response = await fetch(
          `${API_BASE_URL}/company/${companyId}/employees`,
          {
            headers: {
              Authorization: `Bearer ${session?.access_token}`,
            },
          }
        );
        const data = await response.json();
        setEmployees(data);
      } catch (err) {
        console.error("Failed to fetch employees", err);
      }
    };

    if (isOpen) {
      fetchAllowanceTypes();
      fetchEmployees();
    }
  }, [isOpen, companyId, session]);

  const handleSave = async () => {
    if (
      !allowanceTypeId ||
      !employeeId ||
      !value ||
      !startMonth ||
      !startYear
    ) {
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
        allowance_type_id: allowanceTypeId,
        employee_id: employeeId,
        value: parseFloat(value),
        calculation_type: calculationType,
        is_recurring: isRecurring,
        start_month: startMonth,
        start_year: parseInt(startYear),
        end_month: apiEndMonth,
        end_year: apiEndYear ? parseInt(apiEndYear) : null,
      };

      const response = await fetch(
        `${API_BASE_URL}/company/${companyId}/allowances`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to assign allowance");
      }

      toast.success("Allowance assigned successfully.");

      onUpdated();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to assign allowance. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign New Allowance</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2 pb-4">
          <div className="space-y-2">
            <Label htmlFor="allowance-type">Allowance Type</Label>
            <Popover
              open={openAllowanceType}
              onOpenChange={setOpenAllowanceType}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openAllowanceType}
                  className="w-full justify-between"
                >
                  {allowanceTypeId
                    ? allowanceTypes.find((type) => type.id === allowanceTypeId)
                        ?.name
                    : "Select allowance type..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[350px] p-0">
                <Command>
                  <CommandInput placeholder="Search allowance types..." />
                  <CommandEmpty>No allowance type found.</CommandEmpty>
                  <CommandGroup>
                    {allowanceTypes.map((type) => (
                      <CommandItem
                        key={type.id}
                        onSelect={() => {
                          setAllowanceTypeId(type.id);
                          setOpenAllowanceType(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            allowanceTypeId === type.id
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {type.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="employee">Employee</Label>
            <Popover open={openEmployee} onOpenChange={setOpenEmployee}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openEmployee}
                  className="w-full justify-between"
                >
                  {employeeId
                    ? employees.find((emp) => emp.id === employeeId)?.first_name
                    : "Select an employee..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[350px] p-0">
                <Command>
                  <CommandInput placeholder="Search employees..." />
                  <CommandEmpty>No employee found.</CommandEmpty>
                  <CommandGroup>
                    {employees.map((emp) => (
                      <CommandItem
                        key={emp.id}
                        onSelect={() => {
                          setEmployeeId(emp.id);
                          setOpenEmployee(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            employeeId === emp.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {`${emp.first_name} ${emp.last_name}`}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
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
                defaultValue="Fixed"
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
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Assigning..." : "Assign Allowance"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
