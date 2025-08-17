// src/components/company/payroll/statutory/DeleteAllowanceDialog.tsx
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
import { AllowanceType } from "./AllowanceManageTable";

type Props = {
  allowance: AllowanceType;
  companyId: string;
  onClose: () => void;
  onDeleted: () => void;
};

export default function DeleteAllowanceDialog({ allowance, companyId, onClose, onDeleted }: Props) {
  const { session } = useAuthStore();

  const handleDelete = async () => {
    try {
      await fetch(`${API_BASE_URL}/company/${companyId}/allowance-types/${allowance.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });
      onDeleted();
      onClose();
    } catch (err) {
      console.error("Failed to delete allowance type", err);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Allowance Type</DialogTitle>
        </DialogHeader>
        <p>Are you sure you want to delete <b>{allowance.name}</b>?</p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}