import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/config";
import { useAuthStore } from "@/stores/authStore";
import { EmployeeWithHelb } from "@/pages/company/payroll/deductions/HELBSection";
import { Loader2 } from "lucide-react";

interface DeleteHelbDialogProps {
  employee: EmployeeWithHelb;
  companyId: string;
  onClose: () => void;
  onDeleted: () => void;
}

export default function DeleteHelbDialog({
  employee,
  companyId,
  onClose,
  onDeleted,
}: DeleteHelbDialogProps) {
  const { session } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/company/${companyId}/employees/${employee.id}/helb`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete HELB record.");
      }

      onDeleted();
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Confirm Deletion</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the HELB record for{" "}
            <b>
              {employee.first_name} {employee.last_name}
            </b>
            ? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
