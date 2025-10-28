import React, { useState, useEffect } from 'react';
import { format } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar"; 
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"; 
import { cn } from "@/lib/utils";
import { useHrStore, Employee } from '@/stores/hrStore';
import { toast } from 'sonner';

interface ChangeEmployeeStatusDialogProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
}

const ChangeEmployeeStatusDialog: React.FC<ChangeEmployeeStatusDialogProps> = ({ isOpen, onClose, employee }) => {
  const [employeeStatus, setEmployeeStatus] = useState<string>('');
  const [effectiveDate, setEffectiveDate] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(false);
  const { updateEmployeeStatus } = useHrStore();

  useEffect(() => {
    if (employee) {
      setEmployeeStatus(employee.employee_status);
      setEffectiveDate(employee.employee_status_effective_date ? new Date(employee.employee_status_effective_date) : new Date());
    }
  }, [employee]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee || !employee.company_id || !employee.id || !effectiveDate) return;

    setLoading(true);

    // Format the date to YYYY-MM-DD string for the backend
    const formattedDate = format(effectiveDate, "yyyy-MM-dd");

    // Pass the effective date to the store action
 const success = await updateEmployeeStatus(employee.company_id, employee.id, {
  employee_status: employeeStatus,
  employee_status_effective_date: formattedDate,
});
    setLoading(false);

    if (success) {
      toast.success('Employee status updated successfully.');
      onClose();
    } else {
      toast.error('Failed to update employee status.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change Employee Status</DialogTitle>
          <DialogDescription>
            Update the status of {employee?.first_name} {employee?.last_name}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="employee_status">Employee Status</Label>
              <Select onValueChange={setEmployeeStatus} value={employeeStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="On Leave">On Leave</SelectItem>
                  <SelectItem value="Terminated">Terminated</SelectItem>
                  <SelectItem value="Suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Picker for Effective Date */}
            <div className="space-y-2">
              <Label htmlFor="effective_date">Effective Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !effectiveDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {effectiveDate ? format(effectiveDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={effectiveDate}
                    onSelect={setEffectiveDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ChangeEmployeeStatusDialog;