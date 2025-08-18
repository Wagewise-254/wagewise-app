// src/components/company/payroll/deductions/DeductionManageSection.tsx

import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { API_BASE_URL } from "@/config";
import { useAuthStore } from "@/stores/authStore";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import DeductionManageTable, { DeductionType } from "./DeductionManageTable";
import AddDeductionDialog from "./AddDeductionDialog";
import EditDeductionDialog from "./EditDeductionDialog";
import DeleteDeductionDialog from "./DeleteDeductionDialog";

const DeductionManageSection = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const { session } = useAuthStore();

  const [deductions, setDeductions] = useState<DeductionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDeduction, setSelectedDeduction] = useState<DeductionType | null>(null);

  const fetchData = useCallback(async () => {
    if (!companyId || !session) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/company/${companyId}/deduction-types`, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch deduction types");
      }

      const data = await response.json();
      setDeductions(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load deduction types. Please try again.");
      toast.error("Failed to load deduction types.");
    } finally {
      setLoading(false);
    }
  }, [companyId, session]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddSuccess = () => {
    fetchData();
    setIsAddDialogOpen(false);
  };

  const handleEdit = (deduction: DeductionType) => {
    setSelectedDeduction(deduction);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (deduction: DeductionType) => {
    setSelectedDeduction(deduction);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setSelectedDeduction(null);
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedDeduction(null);
  };

  const handleUpdateSuccess = () => {
    fetchData();
    handleCloseEditDialog();
    handleCloseDeleteDialog();
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">Deduction Types</CardTitle>
            <CardDescription>
              Define and manage deduction types available in your company.
            </CardDescription>
          </div>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-[#7F5EFD] text-white hover:bg-[#6a4ad3]"
          >
            Add Deduction Type
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-10">
              {error}
            </div>
          ) : (
            <DeductionManageTable data={deductions} onEdit={handleEdit} onDelete={handleDelete} />
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      {isAddDialogOpen && (
        <AddDeductionDialog
          companyId={companyId!}
          isOpen={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onUpdated={handleAddSuccess}
        />
      )}

      {isEditDialogOpen && selectedDeduction && (
        <EditDeductionDialog
          deduction={selectedDeduction}
          companyId={companyId!}
          isOpen={isEditDialogOpen}
          onClose={handleCloseEditDialog}
          onUpdated={handleUpdateSuccess}
        />
      )}

      {isDeleteDialogOpen && selectedDeduction && (
        <DeleteDeductionDialog
          deduction={selectedDeduction}
          companyId={companyId!}
          isOpen={isDeleteDialogOpen}
          onClose={handleCloseDeleteDialog}
          onDeleted={handleUpdateSuccess}
        />
      )}
    </div>
  );
};

export default DeductionManageSection;