import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { API_BASE_URL } from "@/config";
import { useAuthStore } from "@/stores/authStore";
import { Plus, Download, Upload } from "lucide-react";
import AbsentDaysTable from "./AbsentDaysTable";
import AddAbsentDaysDialog from "./AddAbsentDaysDialog";
import EditAbsentDaysDialog from "./EditAbsentDaysDialog";
import DeleteAbsentDaysDialog from "./DeleteAbsentDaysDialog";
import BulkDeleteAbsentDaysDialog from "./BulkDeleteAbsentDaysDialog";
import ImportAbsentDaysDialog from "./ImportAbsentDaysDialog";
import { AbsentDays } from "@/types/absentDays";

export default function AbsentDaysSection() {
  const { companyId } = useParams();
  const { session } = useAuthStore();
  
  const [absentDays, setAbsentDays] = useState<AbsentDays[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAbsentDays, setSelectedAbsentDays] = useState<AbsentDays | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  // Wrap fetchAbsentDays in useCallback
  const fetchAbsentDays = useCallback(async () => {
    if (!companyId) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/company/${companyId}/absent-days`,
        {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch absent days");
      }

      const data = await response.json();
      setAbsentDays(data);
    } catch (error) {
      console.error("Error fetching absent days:", error);
      toast.error("Failed to load absent days");
    } finally {
      setLoading(false);
    }
  }, [companyId, session?.access_token]); // Add dependencies

  useEffect(() => {
    fetchAbsentDays();
  }, [fetchAbsentDays]); // Now you can include fetchAbsentDays in the dependency array

  const handleEdit = (record: AbsentDays) => {
    setSelectedAbsentDays(record);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (record: AbsentDays) => {
    setSelectedAbsentDays(record);
    setIsDeleteDialogOpen(true);
  };

  const handleBulkDelete = (ids: string[]) => {
    setSelectedIds(ids);
    setIsBulkDeleteDialogOpen(true);
  };

  const handleDownloadTemplate = useCallback(async () => {
    if (!companyId) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/company/${companyId}/absent-days/template`,
        {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to download template");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Absent_Days_Import_Template.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success("Template downloaded successfully");
    } catch (error) {
      console.error("Error downloading template:", error);
      toast.error("Failed to download template");
    }
  }, [companyId, session?.access_token]); // Also wrap this if you want

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <h2 className="text-lg font-medium text-slate-900">Absent Days</h2>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1F3A8A]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-slate-900">Absent Days</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 border-slate-300 text-slate-700 hover:bg-slate-100"
          >
            <Download className="h-4 w-4" />
            Template
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsImportDialogOpen(true)}
            className="flex items-center gap-2 border-slate-300 text-slate-700 hover:bg-slate-100"
          >
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <Button
            size="sm"
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-[#1F3A8A] hover:bg-[#162a63] text-white flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Absent Days
          </Button>
        </div>
      </div>

      <AbsentDaysTable
        data={absentDays}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onBulkDelete={handleBulkDelete}
      />

      {/* Dialogs */}
      <AddAbsentDaysDialog
        companyId={companyId!}
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAdded={fetchAbsentDays}
      />

      {selectedAbsentDays && (
        <>
          <EditAbsentDaysDialog
            absentDays={selectedAbsentDays}
            companyId={companyId!}
            isOpen={isEditDialogOpen}
            onClose={() => {
              setIsEditDialogOpen(false);
              setSelectedAbsentDays(null);
            }}
            onUpdated={fetchAbsentDays}
          />

          <DeleteAbsentDaysDialog
            absentDays={selectedAbsentDays}
            companyId={companyId!}
            isOpen={isDeleteDialogOpen}
            onClose={() => {
              setIsDeleteDialogOpen(false);
              setSelectedAbsentDays(null);
            }}
            onDeleted={fetchAbsentDays}
          />
        </>
      )}

      <BulkDeleteAbsentDaysDialog
        absentDaysIds={selectedIds}
        companyId={companyId!}
        isOpen={isBulkDeleteDialogOpen}
        onClose={() => {
          setIsBulkDeleteDialogOpen(false);
          setSelectedIds([]);
        }}
        onDeleted={fetchAbsentDays}
      />

      <ImportAbsentDaysDialog
        companyId={companyId!}
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        onUpdated={fetchAbsentDays}
      />
    </div>
  );
}