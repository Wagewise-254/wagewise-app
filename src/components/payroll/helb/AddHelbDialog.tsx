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
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/authStore";
import { API_BASE_URL } from "@/config";
import { EmployeeWithHelb } from "@/pages/company/payroll/deductions/HELBSection";
import {
  FloatingField,
  FloatingSearchableSelect,
} from "@/components/company/employees/employeeutils";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [employees, setEmployees] = useState<EmployeeWithHelb[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [helbAccountNumber, setHelbAccountNumber] = useState("");
  const [initialBalance, setInitialBalance] = useState("");
  const [monthlyDeduction, setMonthlyDeduction] = useState("");
  const [startDate, setStartDate] = useState("");
  const [status, setStatus] = useState("")
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>(
    {},
  );

  const fetchEmployees = useCallback(async () => {
    if (!companyId || !session) return;
    try {
      const response = await fetch(
        `${API_BASE_URL}/company/${companyId}/employees`,
        {
          headers: { Authorization: `Bearer ${session.access_token}` },
        },
      );
      if (!response.ok) throw new Error("Failed to fetch employees.");
      const employeesData = await response.json();

      const filteredEmployees = employeesData.filter(
        (emp: EmployeeWithHelb) => !emp.helb_accounts,
      );
      setEmployees(filteredEmployees);
    } catch (err) {
      console.error(err);
      setError("Failed to load employees.");
    }
  }, [companyId, session]);

  useEffect(() => {
    if (isOpen) {
      fetchEmployees();
      resetForm();
    }
  }, [isOpen, fetchEmployees]);

  const resetForm = () => {
    setSelectedEmployee("");
    setHelbAccountNumber("");
    setInitialBalance("");
    setMonthlyDeduction("");
    setStartDate("");
    setStatus("")
    setError(null);
    setFieldErrors({});
    setTouchedFields({});
  };

  const validateField = (field: string, value: string): string => {
    if (!value || value.trim() === "") {
      return `${field.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())} is required`;
    }
    return "";
  };

  const validateData = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedEmployee) newErrors.employee = "Employee is required";

    const helbError = validateField("helbAccountNumber", helbAccountNumber);
    if (helbError) newErrors.helbAccountNumber = helbError;

    const balanceError = validateField("initialBalance", initialBalance);
    if (balanceError) newErrors.initialBalance = balanceError;

    const deductionError = validateField("monthlyDeduction", monthlyDeduction);
    if (deductionError) newErrors.monthlyDeduction = deductionError;

    const dateError = validateField("startDate", startDate);
    if (dateError) newErrors.startDate = dateError;

    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /*
  const handleFieldBlur = (field: string) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
    
    let value = "";
    let error = "";
    
    switch (field) {
      case "helbAccountNumber":
        value = helbAccountNumber;
        error = validateField("helbAccountNumber", value);
        setFieldErrors(prev => ({ ...prev, helbAccountNumber: error }));
        break;
      case "initialBalance":
        value = initialBalance;
        error = validateField("initialBalance", value);
        setFieldErrors(prev => ({ ...prev, initialBalance: error }));
        break;
      case "monthlyDeduction":
        value = monthlyDeduction;
        error = validateField("monthlyDeduction", value);
        setFieldErrors(prev => ({ ...prev, monthlyDeduction: error }));
        break;
      case "startDate":
        value = startDate;
        error = validateField("startDate", value);
        setFieldErrors(prev => ({ ...prev, startDate: error }));
        break;
    }
  };*/

  const handleSave = async () => {
    // Mark all fields as touched
    const allTouched = {
      employee: true,
      helbAccountNumber: true,
      initialBalance: true,
      monthlyDeduction: true,
      startDate: true,
    };
    setTouchedFields(allTouched);

    if (!validateData()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const employee = employees.find((emp) => emp.id === selectedEmployee);
      if (!employee) throw new Error("Selected employee not found");

      const response = await fetch(
        `${API_BASE_URL}/company/${companyId}/employees/${selectedEmployee}/helb`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            helb_account_number: helbAccountNumber,
            initial_balance: parseFloat(initialBalance),
            monthly_deduction: parseFloat(monthlyDeduction),
            start_date: startDate,
            status: status,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add HELB record.");
      }

      onUpdated();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Transform employees for the searchable select
  const employeeOptions = employees.map((emp) => ({
    id: emp.id,
    name: `${emp.employee_number} | ${emp.first_name} ${emp.last_name}`,
  }));

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md rounded-sm p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-xl">Add HELB Record</DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Create a new HELB deduction record for an employee.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-2">
          <FloatingSearchableSelect
            label="Employee"
            value={selectedEmployee}
            options={employeeOptions}
            onChange={(value) => {
              setSelectedEmployee(value);
              setFieldErrors((prev) => ({ ...prev, employee: "" }));
            }}
            required
            error={touchedFields.employee ? fieldErrors.employee : undefined}
          />
        </div>

        {selectedEmployee && (
          <div className="px-6 space-y-1">
            <FloatingField
              label="HELB Account Number"
              required
              value={helbAccountNumber}
              error={
                touchedFields.helbAccountNumber
                  ? fieldErrors.helbAccountNumber
                  : undefined
              }
              onChange={(e) => {
                setHelbAccountNumber(e.target.value);
                setFieldErrors((prev) => ({ ...prev, helbAccountNumber: "" }));
              }}
            />
            <FloatingField
              label="Initial Balance"
              required
              value={initialBalance}
              type="number"
              error={
                touchedFields.initialBalance
                  ? fieldErrors.initialBalance
                  : undefined
              }
              onChange={(e) => {
                setInitialBalance(e.target.value);
                setFieldErrors((prev) => ({ ...prev, initialBalance: "" }));
              }}
            />
            <FloatingField
              label="Monthly Deduction"
              required
              value={monthlyDeduction}
              type="number"
              error={
                touchedFields.monthlyDeduction
                  ? fieldErrors.monthlyDeduction
                  : undefined
              }
              onChange={(e) => {
                setMonthlyDeduction(e.target.value);
                setFieldErrors((prev) => ({ ...prev, monthlyDeduction: "" }));
              }}
            />
            <FloatingField
              label="Start Date"
              required
              value={startDate}
              type="date"
              error={
                touchedFields.startDate ? fieldErrors.startDate : undefined
              }
              onChange={(e) => {
                setStartDate(e.target.value);
                setFieldErrors((prev) => ({ ...prev, startDate: "" }));
              }}
            />
            {/* Status Button Group */}
            <div className="px-6 py-2">
              <Label className="text-sm font-medium text-slate-700 mb-2 block">
                Status <span className="text-rose-500">*</span>
              </Label>
              <div className="flex gap-2">
                {["ACTIVE", "SUSPENDED", "COMPLETED"].map((statusOption) => (
                  <Button
                    key={statusOption}
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cn(
                      "flex-1 rounded-sm shadow-none capitalize",
                      status === statusOption
                        ? statusOption === "ACTIVE"
                          ? "border-green-200 bg-green-50 text-green-700 border-2"
                          : statusOption === "SUSPENDED"
                            ? "border-yellow-200 bg-yellow-50 text-yellow-700 border-2"
                            : "border-blue-200 bg-blue-50 text-blue-700 border-2"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50",
                    )}
                    onClick={() => setStatus(statusOption)}
                  >
                    {statusOption.toLowerCase()}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="px-6 py-3">
            <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 p-3 rounded-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </div>
        )}

        <DialogFooter className="px-6 py-4 border-t border-slate-100 mt-4">
          <div className="flex w-full gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 rounded-sm shadow-none border border-[#1F3A8A] cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading || !selectedEmployee}
              className="flex-1 rounded-sm shadow-none bg-[#1F3A8A] cursor-pointer "
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
