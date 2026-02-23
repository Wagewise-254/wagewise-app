import React, { useState, useEffect, useCallback } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Pencil, Trash2, Plus, Loader2, CircleOff } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import { API_BASE_URL } from "@/config";
import {
  BorderFloatingField,
  BorderFloatingSelect,
} from "@/components/company/employees/employeeutils";
import { cn } from "@/lib/utils";

type DeductionType = {
  id: string;
  name: string;
  description?: string | null;
  is_pre_tax: boolean;
  has_maximum_value: boolean;
  maximum_value?: number | null;
  code: string;
};

interface Props {
  companyId: string;
}

export function OtherDeductionsTable({ companyId }: Props) {
  const [data, setData] = useState<DeductionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<DeductionType | null>(null);
  const [deleteItem, setDeleteItem] = useState<DeductionType | null>(null);
  const session = useAuthStore.getState().session;

  const fetchDeductions = useCallback(async () => {
    try {
      setLoading(true);
      const token = session?.access_token;
      const response = await fetch(
        `${API_BASE_URL}/company/${companyId}/deduction-types`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const result = await response.json();
      setData(Array.isArray(result) ? result : []);
    } catch (error) {
      toast.error("Failed to load deductions");
      console.error("Failed to fetch:", error);
    } finally {
      setLoading(false);
    }
  }, [companyId, session?.access_token]);

  useEffect(() => {
    fetchDeductions();
  }, [fetchDeductions]);

  const handleSave = async (values: Omit<DeductionType, "id">) => {
    const token = session?.access_token;
    const isEditing = !!editingItem;
    const url = isEditing
      ? `${API_BASE_URL}/company/${companyId}/deduction-types/${editingItem.id}`
      : `${API_BASE_URL}/company/${companyId}/deduction-types`;

    try {
      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        toast.success(isEditing ? "Deduction updated" : "Deduction created");
        setOpenDialog(false);
        setEditingItem(null);
        fetchDeductions();
      } else {
        const err = await response.json();
        toast.error(err.error || "Operation failed");
      }
    } catch (error) {
      toast.error("Failed to save deduction");
      console.error("Save error:", error);
    }
  };

  const handleDelete = async (id: string) => {
    const token = session?.access_token;

    try {
      const response = await fetch(
        `${API_BASE_URL}/company/${companyId}/deduction-types/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        toast.success("Deduction deleted successfully");
        fetchDeductions();
      } else {
        const err = await response.json();
        toast.error(err.error || "Could not delete deduction");
      }
    } catch (error) {
      toast.error("Failed to delete deduction");
    }
  };

  const columns: ColumnDef<DeductionType>[] = [
    {
      accessorKey: "name",
      header: "Deduction",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-900">{row.original.name}</span>
          {row.original.description && (
            <span className="text-xs text-slate-500 truncate max-w-50">
              {row.original.description}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => (
        <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded-md">
          {row.original.code}
        </span>
      ),
    },
    {
      accessorKey: "is_pre_tax",
      header: "Tax Status",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={cn(
            "font-normal",
            row.original.is_pre_tax
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-slate-50 text-slate-600 border-slate-200"
          )}
        >
          {row.original.is_pre_tax ? "Pre-Tax" : "Post-Tax"}
        </Badge>
      ),
    },
    {
      header: "Max Limit",
      cell: ({ row }) =>
        row.original.has_maximum_value ? (
          <span className="font-mono text-sm font-medium">
            KES {Number(row.original.maximum_value).toLocaleString()}
          </span>
        ) : (
          <span className="text-slate-400 text-sm">—</span>
        ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-1 justify-end">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setEditingItem(item);
                setOpenDialog(true);
              }}
              className="h-8 w-8 hover:bg-slate-100"
            >
              <Pencil className="h-4 w-4 text-slate-600" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteItem(item)}
              className="h-8 w-8 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditingItem(null);
            setOpenDialog(true);
          }}
          className="bg-[#1F3A8A] hover:bg-[#162a63] h-10  rounded-sm shadow-none px-4 text-sm font-medium transition-all hover:-translate-y-0.5 cursor-pointer"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Deduction
        </Button>
      </div>

      <div className="border border-slate-200 px-1 rounded-lg overflow-hidden bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-b border-slate-200">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-xs font-semibold text-slate-600 uppercase tracking-wider py-4"
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="relative">
                      <Loader2 className="h-8 w-8 animate-spin text-[#1F3A8A]" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-3 w-3 bg-[#1F3A8A]/20 rounded-full" />
                      </div>
                    </div>
                    <p className="text-sm font-medium text-slate-600">
                      Loading deductions...
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 group"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="bg-slate-100 p-3 rounded-full">
                      <CircleOff className="h-6 w-6 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        No deductions configured
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Get started by adding your first deduction type
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingItem(null);
                        setOpenDialog(true);
                      }}
                      className="mt-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    >
                      <Plus className="mr-2 h-3 w-3" />
                      Add your first deduction
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DeductionDialog
        open={openDialog}
        onOpenChange={setOpenDialog}
        initialData={editingItem}
        onSave={handleSave}
      />

      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent className="rounded-lg border-slate-200 shadow-lg max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg text-slate-900">
              Delete deduction type?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-500">
              This action cannot be undone. This will permanently delete the{" "}
              <span className="font-medium text-slate-700">{deleteItem?.name}</span>{" "}
              deduction and may affect existing payroll calculations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel className="border-slate-300 hover:bg-slate-50 hover:text-slate-900 rounded-md">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteItem && handleDelete(deleteItem.id)}
              className="bg-red-600 hover:bg-red-700 text-white rounded-md"
            >
              Delete Deduction
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============= DIALOG COMPONENT =============
interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: DeductionType | null;
  onSave: (values: Omit<DeductionType, "id">) => void;
}

function DeductionDialog({ open, onOpenChange, initialData, onSave }: DialogProps) {
  const deductionOptions = [
    { label: "Mortgage Interest", value: "MORTGAGE_INTEREST" },
    { label: "Post Retirement Medical Fund (PRMF)", value: "PRMF" },
    { label: "Other", value: "OTHER" },
  ];

  const [selectedCode, setSelectedCode] = React.useState<string>("");
  const [customName, setCustomName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [isPreTax, setIsPreTax] = React.useState(false);
  const [hasMaximum, setHasMaximum] = React.useState(false);
  const [maximumValue, setMaximumValue] = React.useState<number | "">("");

  React.useEffect(() => {
    if (initialData) {
      setSelectedCode(initialData.code);
      setCustomName(initialData.code === "OTHER" ? initialData.name : "");
      setDescription(initialData.description || "");
      setIsPreTax(initialData.is_pre_tax);
      setHasMaximum(initialData.has_maximum_value);
      setMaximumValue(initialData.maximum_value ?? "");
    } else {
      resetForm();
    }
  }, [initialData, open]);

  const resetForm = () => {
    setSelectedCode("");
    setCustomName("");
    setDescription("");
    setIsPreTax(false);
    setHasMaximum(false);
    setMaximumValue("");
  };

  React.useEffect(() => {
    if (selectedCode === "MORTGAGE_INTEREST") {
      setIsPreTax(true);
      setHasMaximum(true);
      setMaximumValue(30000);
    } else if (selectedCode === "PRMF") {
      setIsPreTax(true);
      setHasMaximum(true);
      setMaximumValue(15000);
    } else if (selectedCode === "OTHER") {
      setIsPreTax(false);
      setHasMaximum(false);
      setMaximumValue("");
    }
  }, [selectedCode]);

  const handleSubmit = () => {
    if (!selectedCode) {
      toast.error("Please select a deduction type");
      return;
    }

    if (selectedCode === "OTHER" && !customName.trim()) {
      toast.error("Please enter a deduction name");
      return;
    }

    if (hasMaximum && (!maximumValue || Number(maximumValue) <= 0)) {
      toast.error("Please enter a valid maximum amount");
      return;
    }

    const name =
      selectedCode === "OTHER"
        ? customName.trim()
        : deductionOptions.find((o) => o.value === selectedCode)?.label || "";

    onSave({
      name,
      description: description.trim() || null,
      is_pre_tax: isPreTax,
      has_maximum_value: hasMaximum,
      maximum_value: hasMaximum ? Number(maximumValue) : null,
      code: selectedCode,
    });

    onOpenChange(false);
    resetForm();
  };

  const isLocked = selectedCode === "MORTGAGE_INTEREST" || selectedCode === "PRMF";

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) resetForm();
      }}
    >
      <DialogContent className="sm:max-w-lg rounded-lg border-slate-200 p-0 gap-0 shadow-lg">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100">
          <DialogTitle className="text-lg font-semibold text-slate-900">
            {initialData ? "Edit Deduction Type" : "Add Deduction Type"}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500 mt-1">
            {initialData
              ? "Update the deduction type details below"
              : "Configure a new deduction type for your organization"}
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <BorderFloatingSelect
            label="Deduction Type"
            options={deductionOptions}
            value={selectedCode}
            onChange={(v) => setSelectedCode(v)}
            required
          />

          {selectedCode === "OTHER" && (
            <BorderFloatingField
              label="Deduction Name"
              required
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
            />
          )}

          <BorderFloatingField
            label="Description (Optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div
            className={cn(
              "flex items-center justify-between border rounded-lg p-4",
              isLocked ? "bg-slate-50/50 border-slate-200" : "bg-white border-slate-200"
            )}
          >
            <div className="space-y-0.5">
              <Label className="text-sm font-medium text-slate-700">
                Pre-Tax Deduction
              </Label>
              <p className="text-xs text-slate-500">
                {isLocked
                  ? "Locked based on deduction type"
                  : "Deducted before PAYE calculation"}
              </p>
            </div>
            <Switch
              checked={isPreTax}
              onCheckedChange={setIsPreTax}
              disabled={isLocked}
              className="data-[state=checked]:bg-[#1F3A8A]"
            />
          </div>

          <div
            className={cn(
              "flex items-center justify-between border rounded-lg p-4",
              isLocked ? "bg-slate-50/50 border-slate-200" : "bg-white border-slate-200"
            )}
          >
            <div className="space-y-0.5">
              <Label className="text-sm font-medium text-slate-700">
                Has Maximum Limit
              </Label>
              <p className="text-xs text-slate-500">
                {isLocked
                  ? "Locked based on deduction type"
                  : "Apply a monthly deduction cap"}
              </p>
            </div>
            <Switch
              checked={hasMaximum}
              onCheckedChange={setHasMaximum}
              disabled={isLocked}
              className="data-[state=checked]:bg-[#1F3A8A]"
            />
          </div>

          {hasMaximum && (
            <BorderFloatingField
              label="Maximum Monthly Amount (KES)"
              type="number"
              value={maximumValue}
              onChange={(e) =>
                setMaximumValue(e.target.value ? Number(e.target.value) : "")
              }
              disabled={isLocked}
              required
            />
          )}
        </div>

        <DialogFooter className="p-6 pt-4 border-t border-slate-100 bg-slate-50/50">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-300 text-slate-700 hover:bg-slate-100 rounded-md h-10 px-6"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-[#1F3A8A] hover:bg-[#162a63] px-6 rounded-md h-10 text-sm font-medium shadow-sm"
          >
            {initialData ? "Update" : "Save"} Deduction
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}