import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
//import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
//import { Switch } from "@/components/ui/switch";
import { API_BASE_URL } from "@/config";
import { useAuthStore } from "@/stores/authStore";
import { EmployeeWithHelb } from "@/pages/company/payroll/deductions/HELBSection";
import { FloatingField } from "@/components/company/employees/employeeutils";
import { Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditHelbDialogProps {
  employee: EmployeeWithHelb;
  companyId: string;
  onClose: () => void;
  onUpdated: () => void;
}

type HelbStatus = "ACTIVE" | "SUSPENDED" | "COMPLETED";

export default function EditHelbDialog({
  employee,
  companyId,
  onClose,
  onUpdated,
}: EditHelbDialogProps) {
  const { session } = useAuthStore();
  const [helbAccountNumber, setHelbAccountNumber] = useState("");
  const [initialBalance, setInitialBalance] = useState<string>("");
  const [currentBalance, setCurrentBalance] = useState<string>("");
  const [monthlyDeduction, setMonthlyDeduction] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [status, setStatus] = useState<HelbStatus>("ACTIVE");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  // Status options for the button group
  const statusOptions: HelbStatus[] = ["ACTIVE", "SUSPENDED", "COMPLETED"];

  // Pre-populate form fields with existing data
  useEffect(() => {
    if (employee?.helb_accounts) {
      setHelbAccountNumber(employee.helb_accounts.helb_account_number || "");
      setInitialBalance(employee.helb_accounts.initial_balance?.toString() || "");
      setCurrentBalance(employee.helb_accounts.current_balance?.toString() || "");
      setMonthlyDeduction(employee.helb_accounts.monthly_deduction?.toString() || "");
      setStartDate(employee.helb_accounts.start_date || "");
      setStatus(employee.helb_accounts.status as HelbStatus || "ACTIVE");
    }
  }, [employee]);

  const validateField = (field: string, value: string): string => {
    if (!value || value.trim() === "") {
      const fieldNames: Record<string, string> = {
        helbAccountNumber: "HELB Account number",
        initialBalance: "Initial balance",
        currentBalance: "Current balance",
        monthlyDeduction: "Monthly deduction",
        startDate: "Start date",
      };
      return `${fieldNames[field] || field} is required`;
    }

    // Additional validation for numeric fields
    if (field === "initialBalance" || field === "currentBalance" || field === "monthlyDeduction") {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0) {
        return "Must be a valid positive number";
      }
    }

    return "";
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    const accountError = validateField("helbAccountNumber", helbAccountNumber);
    if (accountError) newErrors.helbAccountNumber = accountError;
    
    const initialError = validateField("initialBalance", initialBalance);
    if (initialError) newErrors.initialBalance = initialError;
    
    const currentError = validateField("currentBalance", currentBalance);
    if (currentError) newErrors.currentBalance = currentError;
    
    const deductionError = validateField("monthlyDeduction", monthlyDeduction);
    if (deductionError) newErrors.monthlyDeduction = deductionError;
    
    const dateError = validateField("startDate", startDate);
    if (dateError) newErrors.startDate = dateError;

    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    // Mark all fields as touched
    setTouchedFields({
      helbAccountNumber: true,
      initialBalance: true,
      currentBalance: true,
      monthlyDeduction: true,
      startDate: true,
    });

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/company/${companyId}/employees/${employee.id}/helb`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            helb_account_number: helbAccountNumber,
            initial_balance: parseFloat(initialBalance),
            current_balance: parseFloat(currentBalance),
            monthly_deduction: parseFloat(monthlyDeduction),
            start_date: startDate,
            status: status,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update HELB record.");
      }

      onUpdated();
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFieldErrors({});
    setTouchedFields({});
    setError(null);
    onClose();
  };

  // Helper to get status color
  const getStatusColor = (statusOption: HelbStatus) => {
    switch (statusOption) {
      case "ACTIVE":
        return "border-green-200 bg-green-50 text-green-700 hover:bg-green-100";
      case "SUSPENDED":
        return "border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100";
      case "COMPLETED":
        return "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100";
      default:
        return "";
    }
  };

  return (
    <Dialog open onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md rounded-sm p-0 gap-0 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="px-6 pt-6 pb-4 sticky top-0 bg-white z-10 border-b">
          <DialogTitle className="text-xl">Edit HELB Deduction</DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Editing HELB details for {employee.first_name} {employee.last_name}.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 space-y-2">
          <FloatingField
            label="HELB Account Number"
            required
            value={helbAccountNumber}
            error={touchedFields.helbAccountNumber ? fieldErrors.helbAccountNumber : undefined}
            onChange={(e) => {
              setHelbAccountNumber(e.target.value);
              setFieldErrors(prev => ({ ...prev, helbAccountNumber: "" }));
            }}
          />
          
          <FloatingField
            label="Initial Balance (KES)"
            required
            value={initialBalance}
            type="number"
            error={touchedFields.initialBalance ? fieldErrors.initialBalance : undefined}
            onChange={(e) => {
              setInitialBalance(e.target.value);
              setFieldErrors(prev => ({ ...prev, initialBalance: "" }));
            }}
          />
          
          <FloatingField
            label="Current Balance (KES)"
            required
            value={currentBalance}
            type="number"
            error={touchedFields.currentBalance ? fieldErrors.currentBalance : undefined}
            onChange={(e) => {
              setCurrentBalance(e.target.value);
              setFieldErrors(prev => ({ ...prev, currentBalance: "" }));
            }}
          />
          
          <FloatingField
            label="Monthly Deduction (KES)"
            required
            value={monthlyDeduction}
            type="number"
            error={touchedFields.monthlyDeduction ? fieldErrors.monthlyDeduction : undefined}
            onChange={(e) => {
              setMonthlyDeduction(e.target.value);
              setFieldErrors(prev => ({ ...prev, monthlyDeduction: "" }));
            }}
          />
          
          <FloatingField
            label="Start Date"
            required
            value={startDate}
            type="date"
            error={touchedFields.startDate ? fieldErrors.startDate : undefined}
            onChange={(e) => {
              setStartDate(e.target.value);
              setFieldErrors(prev => ({ ...prev, startDate: "" }));
            }}
          />

          {/* Status Button Group */}
          <div className="space-y-2 py-2">
            <Label className="text-sm font-medium text-slate-700">
              Status <span className="text-rose-500">*</span>
            </Label>
            <div className="flex gap-2 mt-1">
              {statusOptions.map((statusOption) => (
                <Button
                  key={statusOption}
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(
                    "flex-1 rounded-sm shadow-none capitalize",
                    status === statusOption
                      ? getStatusColor(statusOption) + " border-2 font-semibold"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  )}
                  onClick={() => setStatus(statusOption)}
                >
                  {statusOption.toLowerCase()}
                </Button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400">
              Select the current status of this HELB deduction
            </p>
          </div>
        </div>

        {error && (
          <div className="px-6 py-3">
            <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 p-3 rounded-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        )}

        <DialogFooter className="px-6 py-4 border-t border-slate-100 sticky bottom-0 bg-white">
          <div className="flex w-full gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 rounded-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="flex-1 rounded-sm bg-[#7F5EFD] hover:bg-[#6a4acb] text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}