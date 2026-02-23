import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { ArrowLeft, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import AllowanceAssignTable, {
  Allowance,
} from "@/components/company/benefits/AllowanceAssignTable";
import AddAllowanceDialog from "@/components/company/benefits/AddAllowanceDialog";
import EditAllowanceDialog from "@/components/company/benefits/EditAllowanceDialog";
import DeleteAllowanceDialog from "@/components/company/benefits/DeleteAllowanceDialog";
import ImportAllowanceDialog from "@/components/company/benefits/ImportAllowanceDialog";
import BulkDeleteAllowanceDialog from "@/components/company/benefits/BulkDeleteAllowanceDialog";

export default function AssignBenefits() {
  const { companyId } = useParams();
  const { session } = useAuthStore();
  const navigate = useNavigate();

  const [allowances, setAllowances] = useState<Allowance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedAllowance, setSelectedAllowance] = useState<Allowance | null>(
    null,
  );
  const [allowancesToDelete, setAllowancesToDelete] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    if (!companyId || !session) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/company/${companyId}/allowances`,
        {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch allowances");
      }

      const data = await response.json();
      setAllowances(data);
    } catch (err) {
      console.error("Error fetching allowances:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load allowances",
      );
      toast.error("Failed to load allowances. Please try again.");
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
    toast.success("Allowance assigned successfully");
  };

  const handleEdit = (allowance: Allowance) => {
    setSelectedAllowance(allowance);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (allowance: Allowance) => {
    setSelectedAllowance(allowance);
    setIsDeleteDialogOpen(true);
  };

  const handleBulkDelete = (allowanceIds: string[]) => {
    setAllowancesToDelete(allowanceIds);
    setIsBulkDeleteDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setSelectedAllowance(null);
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedAllowance(null);
  };

  const handleUpdateSuccess = () => {
    fetchData();
    handleCloseEditDialog();
    handleCloseDeleteDialog();
  };

  const handleImportSuccess = () => {
    setIsImportDialogOpen(false);
    fetchData();
    toast.success("Allowances imported successfully");
  };

  const handleBulkDeleteSuccess = () => {
    fetchData();
    setIsBulkDeleteDialogOpen(false);
    setAllowancesToDelete([]);
  };

  return (
    <div className="p-2 space-y-4">
      <Card className="rounded-sm border border-slate-200 shadow-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex flex-col">
            <div className="flex gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 cursor-pointer"
                    onClick={() =>
                      navigate(
                        `/company/${companyId}/payroll/benefits/overview`,
                      )
                    }
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Back to Benefits Settings</p>
                </TooltipContent>
              </Tooltip>
              <div>
                <CardTitle className="text-2xl font-bold">
                Assigned Allowances
              </CardTitle>
              <CardDescription className="text-sm text-gray-500">
              Manage allowances assigned to employees, departments, and job
              titles.
            </CardDescription>
              </div>
              
            </div>

            
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsImportDialogOpen(true)}
              className="flex items-center gap-2 cursor-pointer rounded-sm shadow-none border border-slate-300"
            >
              <FileUp className="h-4 w-4" /> Bulk Import
            </Button>
            <Button
              size="sm"
              className="bg-[#1F3A8A] cursor-pointer rounded-sm shadow-none text-white hover:bg-[#6a4ad3]"
              onClick={() => setIsAddDialogOpen(true)}
            >
              Assign Allowance
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-10">{error}</div>
          ) : (
            <AllowanceAssignTable
              data={allowances}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onBulkDelete={handleBulkDelete}
            />
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      {isAddDialogOpen && (
        <AddAllowanceDialog
          companyId={companyId!}
          isOpen={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onUpdated={handleAddSuccess}
        />
      )}

      {isEditDialogOpen && selectedAllowance && (
        <EditAllowanceDialog
          allowance={selectedAllowance}
          companyId={companyId!}
          isOpen={isEditDialogOpen}
          onClose={handleCloseEditDialog}
          onUpdated={handleUpdateSuccess}
        />
      )}

      {isDeleteDialogOpen && selectedAllowance && (
        <DeleteAllowanceDialog
          allowance={selectedAllowance}
          companyId={companyId!}
          isOpen={isDeleteDialogOpen}
          onClose={handleCloseDeleteDialog}
          onDeleted={handleUpdateSuccess}
        />
      )}

      {isBulkDeleteDialogOpen && allowancesToDelete.length > 0 && (
        <BulkDeleteAllowanceDialog
          allowanceIds={allowancesToDelete}
          companyId={companyId!}
          isOpen={isBulkDeleteDialogOpen}
          onClose={() => {
            setIsBulkDeleteDialogOpen(false);
            setAllowancesToDelete([]);
          }}
          onDeleted={handleBulkDeleteSuccess}
        />
      )}

      {isImportDialogOpen && (
        <ImportAllowanceDialog
          companyId={companyId!}
          isOpen={isImportDialogOpen}
          onClose={() => setIsImportDialogOpen(false)}
          onUpdated={handleImportSuccess}
        />
      )}
    </div>
  );
}
