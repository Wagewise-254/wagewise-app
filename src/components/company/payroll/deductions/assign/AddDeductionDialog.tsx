// src/components/company/payroll/deductions/AddDeductionDialog.tsx

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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
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
import { API_BASE_URL } from "@/config";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import { Employee, DeductionType, Department } from "./DeductionAssignSection";

type Props = {
  companyId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
  employees: Employee[];
  deductionTypes: DeductionType[];
  departments: Department[];
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

export default function AddDeductionDialog({
  companyId,
  isOpen,
  onClose,
  onUpdated,
  employees,
  deductionTypes,
  departments,
}: Props) {
  const { session } = useAuthStore();
  const [loading, setLoading] = useState(false);

  // Form State
  const [assignTo, setAssignTo] = useState<"employee" | "department">(
    "employee"
  );
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null);
  const [selectedDeductionType, setSelectedDeductionType] =
    useState<DeductionType | null>(null);
  const [value, setValue] = useState<string>("");
  const [calculationType, setCalculationType] = useState<
    "Fixed" | "Percentage"
  >("Fixed");
  const [isRecurring, setIsRecurring] = useState(true);
  const [startMonth, setStartMonth] = useState<string>(getCurrentMonthName());
  const [startYear, setStartYear] = useState<string>(String(currentYear));
  const [endMonth, setEndMonth] = useState<string | null>(null);
  const [endYear, setEndYear] = useState<string | null>(null);

  // Combobox State
  const [openEmployee, setOpenEmployee] = useState(false);
  const [openDeduction, setOpenDeduction] = useState(false);
  const [openDepartment, setOpenDepartment] = useState(false);

  const handleSave = async () => {
    if (!selectedDeductionType || !value || !startMonth || !startYear) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (assignTo === "employee" && !selectedEmployee) {
      toast("Please select an employee.");
      return;
    }

    if (assignTo === "department" && !selectedDepartment) {
      toast.error("Please select a department.");
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
        deduction_type_id: selectedDeductionType.id,
        employee_id: assignTo === "employee" ? selectedEmployee?.id : null,
        department_id:
          assignTo === "department" ? selectedDepartment?.id : null,
        value: parseFloat(value),
        calculation_type: calculationType,
        is_recurring: isRecurring,
        start_month: startMonth,
        start_year: parseInt(startYear),
        end_month: apiEndMonth,
        end_year: apiEndYear ? parseInt(apiEndYear) : null,
      };

      const response = await fetch(
        `${API_BASE_URL}/company/${companyId}/deductions`,
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
        throw new Error("Failed to assign deduction");
      }

      toast.success("Deduction assigned successfully.");

      onUpdated();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to assign deduction. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign Deduction</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Deduction Type Select */}
          <div>
            <Label>Deduction Type</Label>
            <Popover open={openDeduction} onOpenChange={setOpenDeduction}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openDeduction}
                  className="w-full justify-between"
                >
                  {selectedDeductionType
                    ? selectedDeductionType.name
                    : "Select deduction type..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0">
                <Command>
                  <CommandInput placeholder="Search deduction types..." />
                  <CommandEmpty>No deduction type found.</CommandEmpty>
                  <CommandGroup>
                    {deductionTypes.map((type) => (
                      <CommandItem
                        key={type.id}
                        value={type.name}
                        onSelect={() => {
                          setSelectedDeductionType(type);
                          setOpenDeduction(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedDeductionType?.id === type.id
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

          {/* Assign To */}
          <div>
            <Label>Assign to</Label>
            <RadioGroup
              defaultValue="employee"
              onValueChange={(val: "employee" | "department") =>
                setAssignTo(val)
              }
              className="flex space-x-4 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="employee" id="r1" />
                <Label htmlFor="r1">Employee</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="department" id="r2" />
                <Label htmlFor="r2">Department</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Employee/Department Select */}
          {assignTo === "employee" && (
            <div>
              <Label>Employee</Label>
              <Popover open={openEmployee} onOpenChange={setOpenEmployee}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openEmployee}
                    className="w-full justify-between"
                  >
                    {selectedEmployee
                      ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}`
                      : "Select employee..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Search employees..." />
                    <CommandEmpty>No employee found.</CommandEmpty>
                    <CommandGroup>
                      {employees.map((employee) => (
                        <CommandItem
                          key={employee.id}
                          value={`${employee.first_name} ${employee.last_name}`}
                          onSelect={() => {
                            setSelectedEmployee(employee);
                            setOpenEmployee(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedEmployee?.id === employee.id
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {employee.first_name} {employee.last_name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {assignTo === "department" && (
            <div>
              <Label>Department</Label>
              <Popover open={openDepartment} onOpenChange={setOpenDepartment}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openDepartment}
                    className="w-full justify-between"
                  >
                    {selectedDepartment
                      ? selectedDepartment.name
                      : "Select department..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Search departments..." />
                    <CommandEmpty>No department found.</CommandEmpty>
                    <CommandGroup>
                      {departments.map((department) => (
                        <CommandItem
                          key={department.id}
                          value={department.name}
                          onSelect={() => {
                            setSelectedDepartment(department);
                            setOpenDepartment(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedDepartment?.id === department.id
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {department.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Value and Calculation Type */}
          <div>
            <Label htmlFor="value">Value</Label>
            <Input
              id="value"
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
          <div>
            <Label>Calculation Type</Label>
            <RadioGroup
              defaultValue="Fixed"
              onValueChange={(val: "Fixed" | "Percentage") =>
                setCalculationType(val)
              }
              className="flex space-x-4 mt-2"
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

          <div className="space-y-4 rounded-md border p-4">
            <h3 className="text-md font-semibold mb-2">Deduction Period</h3>

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
                    onValueChange={(val) => setEndMonth(val === "ONGOING_PERIOD" ? null : val)}
                  >
                    <SelectTrigger id="end-month" className="w-full">
                      <SelectValue placeholder="No End Month (Ongoing)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ONGOING_PERIOD">No End Month (Ongoing)</SelectItem>
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
                    onValueChange={(val) => setEndYear(val === "ONGOING_PERIOD" ? null : val)}
                    // Disabled check uses the internal state, which is 'ONGOING_PERIOD' if null
                    disabled={endMonth === null || endMonth === "ONGOING_PERIOD"}
                  >
                    <SelectTrigger id="end-year" className="w-full">
                      <SelectValue placeholder="No End Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Change value from "" to "ONGOING_PERIOD" */}
                      <SelectItem value="ONGOING_PERIOD">No End Year</SelectItem> 
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
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            className="bg-[#7F5EFD] text-white hover:bg-[#6a4ad3]"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
