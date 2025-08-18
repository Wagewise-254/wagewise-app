// src/components/company/payroll/deductions/EditDeductionDialog.tsx

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
import { AssignedDeduction } from "./DeductionAssignTable";
import { Employee, DeductionType, Department } from "./DeductionAssignSection";

type Props = {
  deduction: AssignedDeduction;
  companyId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
  employees: Employee[];
  deductionTypes: DeductionType[];
  departments: Department[];
};


export default function EditDeductionDialog({ deduction, companyId, isOpen, onClose, onUpdated, employees, deductionTypes, departments }: Props) {
  const { session } = useAuthStore();
  const [loading, setLoading] = useState(false);

  // Form State
  const [assignTo, setAssignTo] = useState<"employee" | "department">(
    deduction.employee_id ? "employee" : "department"
  );
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    deduction.employee_id ? employees.find(e => e.id === deduction.employee_id) || null : null
  );
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(
    deduction.department_id ? departments.find(d => d.id === deduction.department_id) || null : null
  );
  const [selectedDeductionType, setSelectedDeductionType] = useState<DeductionType | null>(
    deductionTypes.find(dt => dt.id === deduction.deduction_type_id) || null
  );
  const [value, setValue] = useState<string>(deduction.value.toString());
  const [calculationType, setCalculationType] = useState<"Fixed" | "Percentage">(deduction.calculation_type);
  const [isOneTime, setIsOneTime] = useState(deduction.is_one_time);
  const [isActive, setIsActive] = useState(deduction.is_active);
  const [startDate, setStartDate] = useState<Date | undefined>(new Date(deduction.start_date));
  const [endDate, setEndDate] = useState<Date | undefined>(deduction.end_date ? new Date(deduction.end_date) : undefined);

  // Combobox State
  const [openEmployee, setOpenEmployee] = useState(false);
  const [openDeduction, setOpenDeduction] = useState(false);
  const [openDepartment, setOpenDepartment] = useState(false);

  // Handle assignTo change
  useEffect(() => {
    if (assignTo === "employee") {
      setSelectedDepartment(null);
    } else {
      setSelectedEmployee(null);
    }
  }, [assignTo]);

  const handleUpdate = async () => {
    if (!selectedDeductionType || !value || !startDate) {
      toast.error("Please fill in all required fields.");
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
        is_active: isActive,
        start_date: format(startDate, "yyyy-MM-dd"),
        end_date: isOneTime ? format(startDate, "yyyy-MM-dd") : endDate ? format(endDate, "yyyy-MM-dd") : null,
      };

      const response = await fetch(`${API_BASE_URL}/company/${companyId}/deductions/${deduction.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to update deduction");
      }

      toast.success("Deduction updated successfully.");

      onUpdated();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update deduction. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Deduction</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Deduction Type Select - Same as Add dialog */}
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
              value={assignTo}
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

          {/* Employee/Department Select - Same as Add dialog */}
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

          {/* Value and Calculation Type - Same as Add dialog */}
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
              value={calculationType}
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

          {/* One-Time Deduction & Active Toggle */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="isOneTime">Is One-Time?</Label>
              <Switch
                id="isOneTime"
                checked={isOneTime}
                onCheckedChange={setIsOneTime}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="isActive">Is Active?</Label>
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>
          
          {/* Start and End Date - Same as Add dialog */}
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
            onClick={handleUpdate}
            disabled={loading}
          >
            {loading ? "Updating..." : "Update"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}