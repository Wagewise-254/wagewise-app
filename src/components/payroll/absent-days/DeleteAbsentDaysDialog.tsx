import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/config";
import { useAuthStore } from "@/stores/authStore";
import { AbsentDays } from "@/types/absentDays";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type Props = {
  absentDays: AbsentDays;
  companyId: string;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
};

export default function DeleteAbsentDaysDialog({
  absentDays,
  companyId,
  isOpen,
  onClose,
  onDeleted,
}: Props) {
  const { session } = useAuthStore();
  const [loading, setLoading] = useState(false);

  // Helper function to get month name
  const getMonthName = (month: number) => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return months[month - 1];
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/company/${companyId}/absent-days/${absentDays.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete record");
      }

      toast.success("Absent days record deleted successfully.");
      onDeleted();
      onClose();
    } catch (err) {
      console.error("Failed to delete record", err);
      toast.error("Failed to delete record. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const employeeName = absentDays.employees
    ? `${absentDays.employees.first_name} ${absentDays.employees.last_name}`
    : "Unknown Employee";

  const monthYear = `${getMonthName(absentDays.month)} ${absentDays.year}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Absent Days Record</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-600">
          Are you sure you want to delete the absent days record for{" "}
          <span className="font-medium">{employeeName}</span> for{" "}
          <span className="font-medium">{monthYear}</span>? This action cannot be undone.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            className="bg-red-500 text-white hover:bg-red-600"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}