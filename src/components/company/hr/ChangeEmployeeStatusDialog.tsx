import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useHrStore, Employee } from '@/stores/hrStore';
import { toast } from 'sonner';

interface ChangeEmployeeStatusDialogProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
}

const ChangeEmployeeStatusDialog: React.FC<ChangeEmployeeStatusDialogProps> = ({ isOpen, onClose, employee }) => {
  const [employeeStatus, setEmployeeStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { updateEmployeeStatus } = useHrStore();

  useEffect(() => {
    if (employee) {
      setEmployeeStatus(employee.employee_status);
    }
  }, [employee]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee || !employee.company_id || !employee.id) return;

    setLoading(true);
 const success = await updateEmployeeStatus(employee.company_id, employee.id, {
  employee_status: employeeStatus,
  employee_status_effective_date: new Date().toISOString().split('T')[0],
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
      <DialogContent>
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