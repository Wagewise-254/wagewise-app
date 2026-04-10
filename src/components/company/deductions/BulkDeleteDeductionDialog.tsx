// src/components/company/payroll/deductions/BulkDeleteDeductionDialog.tsx

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
  deductionIds: string[];
  companyId: string;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void; // Function to refresh data in the parent
};

export default function BulkDeleteDeductionDialog({
  deductionIds,
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
      const response = await fetch(`${API_BASE_URL}/company/${companyId}/deductions/bulk`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deductionIds }), 
      });

      if (!response.ok) {
        throw new Error("Failed to delete deductions");
      }

      toast.success(`${deductionIds.length} deduction(s) deleted successfully.`);

      onDeleted();
      onClose();
    } catch (err) {
      console.error("Failed to delete deductions", err);
      toast.error("Failed to  delete deductions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const message = deductionIds.length === 1
    ? "Are you sure you want to delete this deduction assignment? This action cannot be undone."
    : `Are you sure you want to delete these ${deductionIds.length} deduction assignments? This action cannot be undone.`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Assigned Deduction{deductionIds.length > 1 ? 's' : ''}</DialogTitle>
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