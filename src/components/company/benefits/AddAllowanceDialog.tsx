// src/components/company/payroll/allowances/AddAllowanceDialog.tsx

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
import { Check, ChevronsUpDown, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
//import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { API_BASE_URL } from "@/config";
import { useAuthStore } from "@/stores/authStore";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { BorderFloatingField } from "@/components/company/employees/employeeutils";

type Props = {
  companyId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
};

type AllowanceType = {
  id: string;
  name: string;
  code: string;
  is_cash: boolean;
  is_taxable: boolean;
  description?: string;
};

type Employee = {
  id: string;
  first_name: string;
  last_name: string;
  employee_number: string;
};

type Department = {
  id: string;
  name: string;
};

type SubDepartment = {
  id: string;
  name: string;
  department_id: string;
};

type JobTitle = {
  id: string;
  title: string;
};

type HousingMetadata = {
  type: "ordinary" | "farm" | "service_director";
  is_employer_owned?: boolean;
  rent_paid_to_employer?: number;
};

type CarMetadata = {
  engine_cc: number;
};

export default function AddAllowanceDialog({
  companyId,
  isOpen,
  onClose,
  onUpdated,
}: Props) {
  const { session } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);

  // Form states
  const [allowanceTypeId, setAllowanceTypeId] = useState<string>("");
  const [selectedAllowanceType, setSelectedAllowanceType] = useState<AllowanceType | null>(null);
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

  // Metadata states
  const [housingMetadata, setHousingMetadata] = useState<HousingMetadata>({
    type: "ordinary",
    is_employer_owned: false,
    rent_paid_to_employer: 0,
  });
  const [carMetadata, setCarMetadata] = useState<CarMetadata>({
    engine_cc: 0,
  });

  // Data lists
  const [allowanceTypes, setAllowanceTypes] = useState<AllowanceType[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subDepartments, setSubDepartments] = useState<SubDepartment[]>([]);
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);

  // Popover states
  const [openAllowanceType, setOpenAllowanceType] = useState(false);
  const [openEmployee, setOpenEmployee] = useState(false);
  const [openDepartment, setOpenDepartment] = useState(false);
  const [openSubDepartment, setOpenSubDepartment] = useState(false);
  const [openJobTitle, setOpenJobTitle] = useState(false);

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
    setAllowanceTypeId("");
    setSelectedAllowanceType(null);
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
    setHousingMetadata({
      type: "ordinary",
      is_employer_owned: false,
      rent_paid_to_employer: 0,
    });
    setCarMetadata({ engine_cc: 0 });
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!isOpen) return;
      
      setFetchingData(true);
      try {
        const headers = {
          Authorization: `Bearer ${session?.access_token}`,
        };

        // Fetch all data in parallel
        const [
          typesResponse,
          employeesResponse,
          deptsResponse,
          subDeptsResponse,
          jobsResponse
        ] = await Promise.all([
          fetch(`${API_BASE_URL}/company/${companyId}/allowance-types`, { headers }),
          fetch(`${API_BASE_URL}/company/${companyId}/employees`, { headers }),
          fetch(`${API_BASE_URL}/company/${companyId}/departments`, { headers }),
          fetch(`${API_BASE_URL}/company/${companyId}/sub-departments`, { headers }),
          fetch(`${API_BASE_URL}/company/${companyId}/job-titles`, { headers })
        ]);

        const [typesData, employeesData, deptsData, subDeptsData, jobsData] = 
          await Promise.all([
            typesResponse.json(),
            employeesResponse.json(),
            deptsResponse.json(),
            subDeptsResponse.json(),
            jobsResponse.json()
          ]);

        setAllowanceTypes(typesData);
        setEmployees(employeesData);
        setDepartments(deptsData);
        setSubDepartments(subDeptsData);
        setJobTitles(jobsData);
      } catch (err) {
        console.error("Failed to fetch data", err);
        toast.error("Failed to load form data");
      } finally {
        setFetchingData(false);
      }
    };

    fetchData();
  }, [isOpen, companyId, session]);

  const handleAllowanceTypeSelect = (type: AllowanceType) => {
    setAllowanceTypeId(type.id);
    setSelectedAllowanceType(type);
    setOpenAllowanceType(false);
  };

  const getMetadata = () => {
    if (!selectedAllowanceType) return {};

    switch (selectedAllowanceType.code) {
      case "HOUSING":
        return housingMetadata;
      case "CAR":
        return carMetadata;
      default:
        return {};
    }
  };

  const validateForm = () => {
    if (!allowanceTypeId) {
      toast.error("Please select an allowance type");
      return false;
    }
    if (!value || Number(value) <= 0) {
      toast.error("Please enter a valid value");
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

    // Validate housing metadata
    if (selectedAllowanceType?.code === "HOUSING") {
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
      selectedAllowanceType?.code === "CAR" &&
      (!carMetadata.engine_cc || carMetadata.engine_cc <= 0)
    ) {
      toast.error("Please enter the car's engine capacity (CC)");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const payload = {
        allowance_type_id: allowanceTypeId,
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
        metadata: getMetadata(),
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
        const error = await response.json();
        throw new Error(error.error || "Failed to assign allowance");
      }

      toast.success("Allowance assigned successfully");
      onUpdated();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to assign allowance");
    } finally {
      setLoading(false);
    }
  };

  const renderAppliesToField = () => {
    switch (appliesTo) {
      case "INDIVIDUAL":
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">Employee</Label>
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
            <Label className="text-sm font-medium text-slate-700">Department</Label>
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
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">Sub-department</Label>
            <Popover open={openSubDepartment} onOpenChange={setOpenSubDepartment}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openSubDepartment}
                  className="w-full justify-between border-slate-200 hover:bg-slate-50 h-10"
                >
                  {subDepartmentId ? (
                    subDepartments.find((sub) => sub.id === subDepartmentId)?.name
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
                    {subDepartments.map((sub) => (
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
        );

      case "JOB_TITLE":
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">Job Title</Label>
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

  const renderMetadataFields = () => {
    if (!selectedAllowanceType) return null;

    switch (selectedAllowanceType.code) {
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
                    checked={housingMetadata.is_employer_owned}
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
            Assign New Allowance
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500 mt-1">
            Configure and assign an allowance to employees
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {fetchingData ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative">
                <Loader2 className="h-8 w-8 animate-spin text-[#1F3A8A]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-3 w-3 bg-[#1F3A8A]/20 rounded-full" />
                </div>
              </div>
              <p className="text-sm font-medium text-slate-600 mt-3">
                Loading form data...
              </p>
            </div>
          ) : (
            <>
              {/* Allowance Type */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Allowance Type *</Label>
                <Popover open={openAllowanceType} onOpenChange={setOpenAllowanceType}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openAllowanceType}
                      className="w-full justify-between border-slate-200 hover:bg-slate-50 h-10"
                    >
                      {selectedAllowanceType ? (
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-xs font-medium px-2 py-0.5 rounded-md",
                            selectedAllowanceType.is_cash
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-purple-50 text-purple-700 border border-purple-200"
                          )}>
                            {selectedAllowanceType.is_cash ? "Cash" : "Non-Cash"}
                          </span>
                          <span>{selectedAllowanceType.name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500">Select allowance type...</span>
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
                    <Command>
                      <CommandInput placeholder="Search allowance types..." className="h-9" />
                      <CommandEmpty>No allowance type found.</CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-auto">
                        {allowanceTypes.map((type) => (
                          <CommandItem
                            key={type.id}
                            onSelect={() => handleAllowanceTypeSelect(type)}
                            className="cursor-pointer"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                allowanceTypeId === type.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "text-xs font-medium px-2 py-0.5 rounded-md",
                                  type.is_cash
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-purple-50 text-purple-700 border border-purple-200"
                                )}>
                                  {type.is_cash ? "Cash" : "Non-Cash"}
                                </span>
                                <span className="font-medium">{type.name}</span>
                              </div>
                              {type.description && (
                                <span className="text-xs text-slate-500">{type.description}</span>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
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
            </>
          )}
        </div>

        <DialogFooter className="p-6 pt-4 border-t border-slate-100 bg-slate-50/50">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading || fetchingData}
            className="border-slate-300 text-slate-700 hover:bg-slate-100 rounded-md h-10 px-6"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || fetchingData}
            className="bg-[#1F3A8A] hover:bg-[#162a63] px-6 rounded-md h-10 text-sm font-medium shadow-sm min-w-35"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Assigning...</span>
              </div>
            ) : (
              "Assign Allowance"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}