// src/components/company/payroll/deductions/AddDeductionDialog.tsx

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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, ChevronsUpDown, Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
//import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { API_BASE_URL } from "@/config";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BorderFloatingField } from "@/components/company/employees/employeeutils";

type Props = {
  companyId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
  employees: Employee[];
  deductionTypes: DeductionType[];
  departments: Department[];
  subDepartments?: SubDepartment[];
  jobTitles?: JobTitle[];
};

export type Employee = {
  id: string;
  first_name: string;
  last_name: string;
  employee_number: string;
};

export type Department = {
  id: string;
  name: string;
};

export type SubDepartment = {
  id: string;
  name: string;
  department_id: string;
};

export type JobTitle = {
  id: string;
  title: string;
};

export type DeductionType = {
  id: string;
  name: string;
  code: string;
  is_pre_tax: boolean;
  description?: string;
  has_maximum_value?: boolean;
  maximum_value?: number;
};

export default function AddDeductionDialog({
  companyId,
  isOpen,
  onClose,
  onUpdated,
  employees,
  deductionTypes,
  departments,
  subDepartments = [],
  jobTitles = [],
}: Props) {
  const { session } = useAuthStore();
  const [loading, setLoading] = useState(false);

  // Form states
  const [deductionTypeId, setDeductionTypeId] = useState<string>("");
  const [selectedDeductionType, setSelectedDeductionType] = useState<DeductionType | null>(null);
  const [appliesTo, setAppliesTo] = useState<string>("INDIVIDUAL");
  const [employeeId, setEmployeeId] = useState<string>("");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [subDepartmentId, setSubDepartmentId] = useState<string>("");
  const [jobTitleId, setJobTitleId] = useState<string>("");
  const [value, setValue] = useState<string>("");
  const [calculationType, setCalculationType] = useState<"FIXED" | "PERCENTAGE">("FIXED");
  const [isRecurring, setIsRecurring] = useState<boolean>(true);
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [numberOfMonths, setNumberOfMonths] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Popover states
  const [openDeductionType, setOpenDeductionType] = useState(false);
  const [openEmployee, setOpenEmployee] = useState(false);
  const [openDepartment, setOpenDepartment] = useState(false);
  const [openSubDepartment, setOpenSubDepartment] = useState(false);
  const [openJobTitle, setOpenJobTitle] = useState(false);

  // Filtered sub-departments based on selected department
  const filteredSubDepartments = subDepartments.filter(
    (sub) => sub.department_id === departmentId
  );

  // Calculate end date when number of months changes
  useEffect(() => {
    if (!isRecurring && startDate && numberOfMonths) {
      const start = new Date(startDate);
      start.setMonth(start.getMonth() + parseInt(numberOfMonths));
      setEndDate(start.toISOString().split("T")[0]);
    } else {
      setEndDate("");
    }
  }, [isRecurring, startDate, numberOfMonths]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setDeductionTypeId("");
    setSelectedDeductionType(null);
    setAppliesTo("INDIVIDUAL");
    setEmployeeId("");
    setDepartmentId("");
    setSubDepartmentId("");
    setJobTitleId("");
    setValue("");
    setCalculationType("FIXED");
    setIsRecurring(true);
    setStartDate(new Date().toISOString().split("T")[0]);
    setNumberOfMonths("");
    setEndDate("");
  };

  const handleDeductionTypeSelect = (type: DeductionType) => {
    setDeductionTypeId(type.id);
    setSelectedDeductionType(type);
    setOpenDeductionType(false);
  };

  const validateForm = () => {
    if (!deductionTypeId) {
      toast.error("Please select a deduction type");
      return false;
    }
    if (!value || Number(value) <= 0) {
      toast.error("Please enter a valid value");
      return false;
    }

    // Validate based on deduction type maximum value
    if (selectedDeductionType?.has_maximum_value && 
        selectedDeductionType.maximum_value && 
        parseFloat(value) > selectedDeductionType.maximum_value) {
      toast.error(`Value cannot exceed ${selectedDeductionType.maximum_value}`);
      return false;
    }

    if (!startDate) {
      toast.error("Please select a start date");
      return false;
    }

    // Validate appliesTo selections
    switch (appliesTo) {
      case "INDIVIDUAL":
        if (!employeeId) {
          toast.error("Please select an employee");
          return false;
        }
        break;
      case "DEPARTMENT":
        if (!departmentId) {
          toast.error("Please select a department");
          return false;
        }
        break;
      case "SUB_DEPARTMENT":
        if (!subDepartmentId) {
          toast.error("Please select a sub-department");
          return false;
        }
        break;
      case "JOB_TITLE":
        if (!jobTitleId) {
          toast.error("Please select a job title");
          return false;
        }
        break;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const payload = {
        deduction_type_id: deductionTypeId,
        applies_to: appliesTo,
        employee_id: appliesTo === "INDIVIDUAL" ? employeeId : null,
        department_id: appliesTo === "DEPARTMENT" ? departmentId : null,
        sub_department_id: appliesTo === "SUB_DEPARTMENT" ? subDepartmentId : null,
        job_title_id: appliesTo === "JOB_TITLE" ? jobTitleId : null,
        value: parseFloat(value),
        calculation_type: calculationType,
        is_recurring: isRecurring,
        start_date: startDate,
        number_of_months: !isRecurring && numberOfMonths ? parseInt(numberOfMonths) : null,
        metadata: {},
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
        const error = await response.json();
        throw new Error(error.error || "Failed to assign deduction");
      }

      toast.success("Deduction assigned successfully");
      onUpdated();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to assign deduction");
    } finally {
      setLoading(false);
    }
  };

  const renderAppliesToField = () => {
    switch (appliesTo) {
      case "INDIVIDUAL":
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">Employee *</Label>
            <Popover open={openEmployee} onOpenChange={setOpenEmployee}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openEmployee}
                  className="w-full justify-between border-slate-200 hover:bg-slate-50 h-10"
                >
                  {employeeId ? (
                    <span className="truncate">
                      {employees.find((emp) => emp.id === employeeId)?.first_name}{" "}
                      {employees.find((emp) => emp.id === employeeId)?.last_name}
                      <span className="text-slate-400 ml-1">
                        ({employees.find((emp) => emp.id === employeeId)?.employee_number})
                      </span>
                    </span>
                  ) : (
                    <span className="text-slate-500">Select employee...</span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
                <Command>
                  <CommandInput placeholder="Search employees..." className="h-9" />
                  <CommandEmpty>No employee found.</CommandEmpty>
                  <CommandGroup className="max-h-64 overflow-auto">
                    {employees.map((emp) => (
                      <CommandItem
                        key={emp.id}
                        onSelect={() => {
                          setEmployeeId(emp.id);
                          setOpenEmployee(false);
                        }}
                        className="cursor-pointer"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            employeeId === emp.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <span>{`${emp.first_name} ${emp.last_name}`}</span>
                          <span className="text-xs text-slate-400">{emp.employee_number}</span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        );

      case "DEPARTMENT":
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">Department *</Label>
            <Popover open={openDepartment} onOpenChange={setOpenDepartment}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openDepartment}
                  className="w-full justify-between border-slate-200 hover:bg-slate-50 h-10"
                >
                  {departmentId ? (
                    departments.find((dept) => dept.id === departmentId)?.name
                  ) : (
                    <span className="text-slate-500">Select department...</span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
                <Command>
                  <CommandInput placeholder="Search departments..." className="h-9" />
                  <CommandEmpty>No department found.</CommandEmpty>
                  <CommandGroup className="max-h-64 overflow-auto">
                    {departments.map((dept) => (
                      <CommandItem
                        key={dept.id}
                        onSelect={() => {
                          setDepartmentId(dept.id);
                          setSubDepartmentId(""); // Reset sub-department when department changes
                          setOpenDepartment(false);
                        }}
                        className="cursor-pointer"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            departmentId === dept.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {dept.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        );

      case "SUB_DEPARTMENT":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Department</Label>
              <Select
                value={departmentId}
                onValueChange={(value) => {
                  setDepartmentId(value);
                  setSubDepartmentId("");
                }}
              >
                <SelectTrigger className="border-slate-200 h-10">
                  <SelectValue placeholder="Select department first" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {departmentId && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Sub-department *</Label>
                <Popover open={openSubDepartment} onOpenChange={setOpenSubDepartment}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openSubDepartment}
                      className="w-full justify-between border-slate-200 hover:bg-slate-50 h-10"
                    >
                      {subDepartmentId ? (
                        filteredSubDepartments.find(
                          (sub) => sub.id === subDepartmentId
                        )?.name
                      ) : (
                        <span className="text-slate-500">Select sub-department...</span>
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
                    <Command>
                      <CommandInput placeholder="Search sub-departments..." className="h-9" />
                      <CommandEmpty>No sub-department found.</CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-auto">
                        {filteredSubDepartments.map((sub) => (
                          <CommandItem
                            key={sub.id}
                            onSelect={() => {
                              setSubDepartmentId(sub.id);
                              setOpenSubDepartment(false);
                            }}
                            className="cursor-pointer"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                subDepartmentId === sub.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span>{sub.name}</span>
                              <span className="text-xs text-slate-400">
                                {departments.find(d => d.id === sub.department_id)?.name}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
        );

      case "JOB_TITLE":
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">Job Title *</Label>
            <Popover open={openJobTitle} onOpenChange={setOpenJobTitle}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openJobTitle}
                  className="w-full justify-between border-slate-200 hover:bg-slate-50 h-10"
                >
                  {jobTitleId ? (
                    jobTitles.find((job) => job.id === jobTitleId)?.title
                  ) : (
                    <span className="text-slate-500">Select job title...</span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
                <Command>
                  <CommandInput placeholder="Search job titles..." className="h-9" />
                  <CommandEmpty>No job title found.</CommandEmpty>
                  <CommandGroup className="max-h-64 overflow-auto">
                    {jobTitles.map((job) => (
                      <CommandItem
                        key={job.id}
                        onSelect={() => {
                          setJobTitleId(job.id);
                          setOpenJobTitle(false);
                        }}
                        className="cursor-pointer"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            jobTitleId === job.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {job.title}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
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
            Assign New Deduction
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500 mt-1">
            Configure and assign a deduction to employees
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Deduction Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">Deduction Type *</Label>
            <Popover open={openDeductionType} onOpenChange={setOpenDeductionType}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openDeductionType}
                  className="w-full justify-between border-slate-200 hover:bg-slate-50 h-10"
                >
                  {selectedDeductionType ? (
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "text-xs font-medium",
                          selectedDeductionType.is_pre_tax 
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-slate-50 text-slate-600 border border-slate-200"
                        )}
                      >
                        {selectedDeductionType.is_pre_tax ? "Pre-tax" : "Post-tax"}
                      </Badge>
                      <span>{selectedDeductionType.name}</span>
                    </div>
                  ) : (
                    <span className="text-slate-500">Select deduction type...</span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
                <Command>
                  <CommandInput placeholder="Search deduction types..." className="h-9" />
                  <CommandEmpty>No deduction type found.</CommandEmpty>
                  <CommandGroup className="max-h-64 overflow-auto">
                    {deductionTypes.map((type) => (
                      <CommandItem
                        key={type.id}
                        onSelect={() => handleDeductionTypeSelect(type)}
                        className="cursor-pointer"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            deductionTypeId === type.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col gap-1 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{type.name}</span>
                            <Badge 
                              variant="secondary" 
                              className={cn(
                                "text-xs",
                                type.is_pre_tax 
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-slate-50 text-slate-600 border border-slate-200"
                              )}
                            >
                              {type.is_pre_tax ? "Pre-tax" : "Post-tax"}
                            </Badge>
                          </div>
                          {type.description && (
                            <span className="text-xs text-slate-500">{type.description}</span>
                          )}
                          {type.has_maximum_value && type.maximum_value && (
                            <span className="text-xs text-slate-400">
                              Max: {type.maximum_value}
                            </span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Deduction type info */}
            {selectedDeductionType && (
              <div className={cn(
                "flex items-start gap-2 text-sm p-3 rounded-lg border",
                selectedDeductionType.is_pre_tax
                  ? "bg-amber-50/80 border-amber-200"
                  : "bg-slate-50 border-slate-200"
              )}>
                <Info className={cn(
                  "h-4 w-4 mt-0.5",
                  selectedDeductionType.is_pre_tax ? "text-amber-700" : "text-slate-500"
                )} />
                <span className={cn(
                  "text-xs",
                  selectedDeductionType.is_pre_tax ? "text-amber-700" : "text-slate-600"
                )}>
                  {selectedDeductionType.is_pre_tax 
                    ? "This is a pre-tax deduction (deducted before tax calculation)"
                    : "This is a post-tax deduction (deducted after tax calculation)"}
                </span>
              </div>
            )}
          </div>

          {/* Applies To */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">Applies To *</Label>
            <Select value={appliesTo} onValueChange={setAppliesTo}>
              <SelectTrigger className="border-slate-200 h-10">
                <SelectValue placeholder="Select who this applies to" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INDIVIDUAL">Individual Employee</SelectItem>
                <SelectItem value="COMPANY">All Employees (Company-wide)</SelectItem>
                <SelectItem value="DEPARTMENT">Department</SelectItem>
                <SelectItem value="SUB_DEPARTMENT">Sub-department</SelectItem>
                <SelectItem value="JOB_TITLE">Job Title</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Conditional field based on appliesTo */}
          {appliesTo !== "COMPANY" && renderAppliesToField()}

          {/* Value and Calculation Type */}
          <div className="grid grid-cols-2 gap-4">
            <BorderFloatingField
              label={calculationType === "PERCENTAGE" ? "Percentage %" : "Amount (KES)"}
              type="number"
             // step={calculationType === "PERCENTAGE" ? "0.01" : "1"}
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

          {/* Maximum value info */}
          {selectedDeductionType?.has_maximum_value && selectedDeductionType.maximum_value && (
            <div className="bg-blue-50/80 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700 flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full" />
                Maximum allowed value: {selectedDeductionType.maximum_value}
                {calculationType === "PERCENTAGE" ? "%" : ""}
              </p>
            </div>
          )}

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
            onClick={handleSave}
            disabled={loading}
            className="bg-[#1F3A8A] hover:bg-[#162a63] px-6 rounded-md h-10 text-sm font-medium shadow-sm min-w-35"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Assigning...</span>
              </div>
            ) : (
              "Assign Deduction"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}