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
import { Loader2 } from "lucide-react";
import { API_BASE_URL } from "@/config";
import { useAuthStore } from "@/stores/authStore";
import { AbsentDays } from "@/types/absentDays";
import { toast } from "sonner";
import {
  BorderFloatingField,
  BorderFloatingSelect,
} from "@/components/company/employees/employeeutils";

type Props = {
  absentDays: AbsentDays;
  companyId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
};

export default function EditAbsentDaysDialog({
  absentDays,
  companyId,
  isOpen,
  onClose,
  onUpdated,
}: Props) {
  const { session } = useAuthStore();
  const [loading, setLoading] = useState(false);

  // Form states
  const [month, setMonth] = useState(absentDays.month.toString());
  const [year, setYear] = useState(absentDays.year.toString());
  const [absentDaysValue, setAbsentDaysValue] = useState(absentDays.absent_days.toString());
  const [totalDeductionAmount, setTotalDeductionAmount] = useState(
    absentDays.total_deduction_amount.toString()
  );
  const [notes, setNotes] = useState(absentDays.notes || "");

  // Reset form when dialog opens with new data
  useEffect(() => {
    if (isOpen) {
      setMonth(absentDays.month.toString());
      setYear(absentDays.year.toString());
      setAbsentDaysValue(absentDays.absent_days.toString());
      setTotalDeductionAmount(absentDays.total_deduction_amount.toString());
      setNotes(absentDays.notes || "");
    }
  }, [isOpen, absentDays]);

  // Generate month options
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString(),
    label: new Date(2000, i, 1).toLocaleString('default', { month: 'long' })
  }));

  const validateForm = () => {
    if (!month) {
      toast.error("Please select a month");
      return false;
    }
    if (!year) {
      toast.error("Please enter a year");
      return false;
    }
    if (!absentDaysValue || parseInt(absentDaysValue) < 0) {
      toast.error("Please enter a valid number of absent days");
      return false;
    }
    if (!totalDeductionAmount || parseFloat(totalDeductionAmount) < 0) {
      toast.error("Please enter a valid deduction amount");
      return false;
    }
    return true;
  };

  const handleUpdate = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const payload = {
        month: parseInt(month),
        year: parseInt(year),
        absent_days: parseInt(absentDaysValue),
        total_deduction_amount: parseFloat(totalDeductionAmount),
        notes: notes || null,
      };

      const response = await fetch(
        `${API_BASE_URL}/company/${companyId}/absent-days/${absentDays.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update absent days");
      }

      toast.success("Absent days updated successfully");
      onUpdated();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to update absent days");
    } finally {
      setLoading(false);
    }
  };

  // Read-only employee display
  const getEmployeeDisplay = () => {
    if (!absentDays.employees) return "Unknown Employee";
    return `${absentDays.employees.first_name} ${absentDays.employees.last_name} (${absentDays.employees.employee_number})`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg rounded-lg border-slate-200 p-0 gap-0 shadow-lg">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100">
          <DialogTitle className="text-lg font-semibold text-slate-900">
            Edit Absent Days
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500 mt-1">
            Update absent days record
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Read-only employee info */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Employee
            </Label>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm text-slate-700">{getEmployeeDisplay()}</p>
            </div>
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
              value={absentDaysValue}
              onChange={(e) => setAbsentDaysValue(e.target.value)}
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
            onClick={handleUpdate}
            disabled={loading}
            className="bg-[#1F3A8A] hover:bg-[#162a63] px-6 rounded-md h-10 text-sm font-medium shadow-sm min-w-35"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Updating...</span>
              </div>
            ) : (
              "Update"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}