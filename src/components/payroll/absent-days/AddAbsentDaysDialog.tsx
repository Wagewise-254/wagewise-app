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
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { API_BASE_URL } from "@/config";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import {
  BorderFloatingField,
  BorderFloatingSelect,
} from "@/components/company/employees/employeeutils";

type Props = {
  companyId: string;
  isOpen: boolean;
  onClose: () => void;
  onAdded: () => void;
};

type Employee = {
  id: string;
  first_name: string;
  last_name: string;
  employee_number: string;
};

export default function AddAbsentDaysDialog({
  companyId,
  isOpen,
  onClose,
  onAdded,
}: Props) {
  const { session } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);

  // Form states
  const [employeeId, setEmployeeId] = useState<string>("");
  const [month, setMonth] = useState<string>("");
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [absentDays, setAbsentDays] = useState<string>("");
  const [totalDeductionAmount, setTotalDeductionAmount] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Data lists
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Popover states
  const [openEmployee, setOpenEmployee] = useState(false);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setEmployeeId("");
    setMonth("");
    setYear(new Date().getFullYear().toString());
    setAbsentDays("");
    setTotalDeductionAmount("");
    setNotes("");
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!isOpen) return;
      
      setFetchingData(true);
      try {
        const headers = {
          Authorization: `Bearer ${session?.access_token}`,
        };

        const response = await fetch(
          `${API_BASE_URL}/company/${companyId}/employees?status=ACTIVE`,
          { headers }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch employees");
        }

        const data = await response.json();
        setEmployees(data);
      } catch (err) {
        console.error("Failed to fetch data", err);
        toast.error("Failed to load employees");
      } finally {
        setFetchingData(false);
      }
    };

    fetchData();
  }, [isOpen, companyId, session]);

  const validateForm = () => {
    if (!employeeId) {
      toast.error("Please select an employee");
      return false;
    }
    if (!month) {
      toast.error("Please select a month");
      return false;
    }
    if (!year) {
      toast.error("Please enter a year");
      return false;
    }
    if (!absentDays || parseInt(absentDays) < 0) {
      toast.error("Please enter a valid number of absent days");
      return false;
    }
    if (!totalDeductionAmount || parseFloat(totalDeductionAmount) < 0) {
      toast.error("Please enter a valid deduction amount");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const payload = {
        employee_id: employeeId,
        month: parseInt(month),
        year: parseInt(year),
        absent_days: parseInt(absentDays),
        total_deduction_amount: parseFloat(totalDeductionAmount),
        notes: notes || null,
      };

      const response = await fetch(
        `${API_BASE_URL}/company/${companyId}/absent-days`,
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
        throw new Error(error.error || "Failed to add absent days");
      }

      toast.success("Absent days added successfully");
      onAdded();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to add absent days");
    } finally {
      setLoading(false);
    }
  };

  // Generate month options
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString(),
    label: new Date(2000, i, 1).toLocaleString('default', { month: 'long' })
  }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg rounded-lg border-slate-200 p-0 gap-0 shadow-lg">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100">
          <DialogTitle className="text-lg font-semibold text-slate-900">
            Add Absent Days
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500 mt-1">
            Record employee absent days and deduction amount
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {fetchingData ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#1F3A8A]" />
              <p className="text-sm font-medium text-slate-600 mt-3">
                Loading employees...
              </p>
            </div>
          ) : (
            <>
              {/* Employee Selection */}
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

              {/* Month and Year */}
              <div className="grid grid-cols-2 gap-4">
                <BorderFloatingSelect
                  label="Month"
                  value={month}
                  options={monthOptions}
                  onChange={setMonth}
                  required
                />
                <BorderFloatingField
                  label="Year"
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  required
                />
              </div>

              {/* Absent Days and Amount */}
              <div className="grid grid-cols-2 gap-4">
                <BorderFloatingField
                  label="Absent Days"
                  type="number"
                  value={absentDays}
                  onChange={(e) => setAbsentDays(e.target.value)}
                  required
                />
                <BorderFloatingField
                  label="Total Deduction (KES)"
                  type="number"
                  value={totalDeductionAmount}
                  onChange={(e) => setTotalDeductionAmount(e.target.value)}
                  required
                />
              </div>

              {/* Notes */}
              <BorderFloatingField
                label="Notes (Optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
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
                <span>Saving...</span>
              </div>
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}