//src/components/company/payroll/allowances/assign/BulkDeleteAllowanceDialog.tsx
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
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type Props = {
  allowanceIds: string[];
  companyId: string;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void; // Function to refresh data in the parent
};

export default function BulkDeleteAllowanceDialog({
  allowanceIds,
  companyId,
  isOpen,
  onClose,
  onDeleted,
}: Props) {
  const { session } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/company/${companyId}/allowances/bulk`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ allowanceIds }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete allowances");
      }

      toast.success(
        `${allowanceIds.length} allowance(s) deleted successfully.`
      );
      onDeleted();
      onClose();
    } catch (error) {
      console.error("Failed to delete allowances", error);
      toast.error("Failed to delete allowances. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const message =
    allowanceIds.length === 1
      ? "Are you sure you want to delete this allowance assignment? This action cannot be undone."
      : `Are you sure you want to delete these ${allowanceIds.length} allowance assignments? This action cannot be undone.`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Delete Assigned Allowance{allowanceIds.length > 1 ? "s" : ""}
          </DialogTitle>
        </DialogHeader>
        <p>{message}</p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            className="bg-red-500 text-white hover:bg-red-600"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              "Delete"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
