// src/pages/company/payroll/AddHelbDialog.tsx

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/authStore";
import { API_BASE_URL } from "@/config";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Employee } from "@/types/statutory"; // Reusing the Employee type

interface AddHelbDialogProps {
  companyId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export default function AddHelbDialog({
  companyId,
  isOpen,
  onClose,
  onUpdated,
}: AddHelbDialogProps) {
  const { session } = useAuthStore();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [helbAccountNumber, setHelbAccountNumber] = useState("");
  const [initialBalance, setInitialBalance] = useState("");
  const [monthlyDeduction, setMonthlyDeduction] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEmployeeLoading, setIsEmployeeLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openCombobox, setOpenCombobox] = useState(false);

  // Fetch employees who are not paying HELB (pays_helb = false)
  const fetchEmployees = useCallback(async () => {
    if (!session || !companyId) return;
    setIsEmployeeLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/company/${companyId}/employees?pays_helb=false`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch employees.");
      }
      const employeesData = await response.json();
      setEmployees(employeesData);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setIsEmployeeLoading(false);
    }
  }, [companyId, session]);

  useEffect(() => {
    if (isOpen) {
      fetchEmployees();
    }
  }, [isOpen, fetchEmployees]);

  const handleSave = async () => {
    if (!selectedEmployee) {
      setError("Please select an employee.");
      return;
    }
    if (!helbAccountNumber || !initialBalance || !monthlyDeduction) {
      setError("All fields are required.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const payload = {
      helb_account_number: helbAccountNumber,
      initial_balance: parseFloat(initialBalance),
      monthly_deduction: parseFloat(monthlyDeduction),
    };

    try {
      const response = await fetch(
        `${API_BASE_URL}/companies/${companyId}/employees/${selectedEmployee.id}/helb`,
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
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save HELB record.");
      }
      
      onUpdated();
      handleClose();

    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedEmployee(null);
    setHelbAccountNumber("");
    setInitialBalance("");
    setMonthlyDeduction("");
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add HELB Record</DialogTitle>
          <DialogDescription>
            Add a new HELB deduction record for an employee.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="employee-select" className="text-right">
              Employee
            </Label>
            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCombobox}
                  className="w-full justify-between col-span-3"
                  disabled={isEmployeeLoading}
                >
                  {selectedEmployee ? (
                    `${selectedEmployee.first_name} ${selectedEmployee.last_name}`
                  ) : (
                    "Select employee..."
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0">
                <Command>
                  <CommandInput placeholder="Search employee..." />
                  <CommandEmpty>No employee found.</CommandEmpty>
                  <CommandGroup>
                    {employees.map((employee) => (
                      <CommandItem
                        key={employee.id}
                        value={`${employee.first_name} ${employee.last_name}`}
                        onSelect={() => {
                          setSelectedEmployee(employee);
                          setOpenCombobox(false);
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

          {selectedEmployee && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="helb-account" className="text-right">
                  HELB Account No.
                </Label>
                <Input
                  id="helb-account"
                  value={helbAccountNumber}
                  onChange={(e) => setHelbAccountNumber(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="initial-balance" className="text-right">
                  Initial Balance
                </Label>
                <Input
                  id="initial-balance"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  type="number"
                  step="0.01"
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="monthly-deduction" className="text-right">
                  Monthly Deduction
                </Label>
                <Input
                  id="monthly-deduction"
                  value={monthlyDeduction}
                  onChange={(e) => setMonthlyDeduction(e.target.value)}
                  type="number"
                  step="0.01"
                  className="col-span-3"
                />
              </div>
            </>
          )}
        </div>
        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading || !selectedEmployee}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}