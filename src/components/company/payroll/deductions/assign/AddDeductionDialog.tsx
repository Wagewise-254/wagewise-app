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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
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

export default function AddDeductionDialog({ companyId, isOpen, onClose, onUpdated, employees, deductionTypes, departments }: Props) {
  const { session } = useAuthStore();
  const [loading, setLoading] = useState(false);

  // Form State
  const [assignTo, setAssignTo] = useState<"employee" | "department">("employee");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [selectedDeductionType, setSelectedDeductionType] = useState<DeductionType | null>(null);
  const [value, setValue] = useState<string>("");
  const [calculationType, setCalculationType] = useState<"Fixed" | "Percentage">("Fixed");
  const [isOneTime, setIsOneTime] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // Combobox State
  const [openEmployee, setOpenEmployee] = useState(false);
  const [openDeduction, setOpenDeduction] = useState(false);
  const [openDepartment, setOpenDepartment] = useState(false);

  const handleSave = async () => {
    if (!selectedDeductionType || !value || !startDate) {
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

    setLoading(true);

    try {
      const payload = {
        deduction_type_id: selectedDeductionType.id,
        employee_id: assignTo === "employee" ? selectedEmployee?.id : null,
        department_id: assignTo === "department" ? selectedDepartment?.id : null,
        value: parseFloat(value),
        calculation_type: calculationType,
        is_one_time: isOneTime,
        start_date: format(startDate, "yyyy-MM-dd"),
        end_date: isOneTime ? format(startDate, "yyyy-MM-dd") : endDate ? format(endDate, "yyyy-MM-dd") : null,
      };

      const response = await fetch(`${API_BASE_URL}/company/${companyId}/deductions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(payload),
      });

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
                            selectedDeductionType?.id === type.id ? "opacity-100" : "opacity-0"
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
              onValueChange={(val: "employee" | "department") => setAssignTo(val)}
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
                              selectedEmployee?.id === employee.id ? "opacity-100" : "opacity-0"
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
                              selectedDepartment?.id === department.id ? "opacity-100" : "opacity-0"
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
              onValueChange={(val: "Fixed" | "Percentage") => setCalculationType(val)}
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

          {/* One-Time Deduction */}
          <div className="flex items-center space-x-2">
            <Label htmlFor="isOneTime">Is One-Time?</Label>
            <Switch
              id="isOneTime"
              checked={isOneTime}
              onCheckedChange={setIsOneTime}
            />
          </div>

          {/* Start and End Date */}
          <div className="flex space-x-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            {!isOneTime && (
              <div>
                <Label htmlFor="endDate">End Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
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