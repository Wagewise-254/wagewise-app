// components/company/employees/AddSalaryDialog.tsx
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/stores/authStore";
import { API_BASE_URL } from "@/config";
import axios from "axios";
import { toast } from "sonner";
import { Employee } from "@/types/employees";

interface AddSalaryDialogProps {
  employee: Employee;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddSalaryDialog({ 
  employee, 
  isOpen, 
  onClose, 
  onSuccess 
}: AddSalaryDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    salary: employee.salary,
    effective_date: new Date().toISOString().split('T')[0],
    reason: "",
    notes: ""
  });

  const session = useAuthStore.getState().session;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(
        `${API_BASE_URL}/company/${employee.company_id}/employees/${employee.id}/salary`,
        formData,
        {
          headers: { Authorization: `Bearer ${session?.access_token}` }
        }
      );

      toast.success("Salary updated successfully");
      onSuccess();
    } catch (error) {
      toast.error("Failed to update salary");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Salary</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="salary">New Salary (KES)</Label>
            <Input
              id="salary"
              type="number"
              value={formData.salary}
              onChange={(e) => setFormData({ ...formData, salary: parseFloat(e.target.value) })}
              required
            />
          </div>
          <div>
            <Label htmlFor="effective_date">Effective Date</Label>
            <Input
              id="effective_date"
              type="date"
              value={formData.effective_date}
              onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Input
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="e.g., Annual increment, Promotion"
            />
          </div>
          <div>
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Salary"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}