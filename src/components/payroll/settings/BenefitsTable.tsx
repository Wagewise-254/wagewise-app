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
import { Switch } from "@/components/ui/switch";
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
import {
  BorderFloatingField,
  BorderFloatingSelect,
} from "@/components/company/employees/employeeutils";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { API_BASE_URL } from "@/config";

type AllowanceType = {
  id: string;
  name: string;
  description?: string | null;
  is_cash: boolean;
  is_taxable: boolean;
  has_maximum_value: boolean;
  maximum_value?: number | null;
  code: string;
};

interface Props {
  companyId: string;
}

export function AllowanceTable({ companyId }: Props) {
  const [data, setData] = useState<AllowanceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<AllowanceType | null>(null);
  const [deleteItem, setDeleteItem] = useState<AllowanceType | null>(null);
  const session = useAuthStore.getState().session;

  const fetchAllowances = useCallback(async () => {
    try {
      setLoading(true);
      const token = session?.access_token;
      const response = await fetch(
        `${API_BASE_URL}/company/${companyId}/allowance-types`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const result = await response.json();
      setData(Array.isArray(result) ? result : []);
    } catch (error) {
      toast.error("Failed to load allowances");
      console.error("Failed to fetch:", error);
    } finally {
      setLoading(false);
    }
  }, [companyId, session?.access_token]);

  useEffect(() => {
    fetchAllowances();
  }, [fetchAllowances]);

  const handleSave = async (values: Omit<AllowanceType, "id">) => {
    const token = session?.access_token;
    const isEditing = !!editingItem;
    const url = isEditing
      ? `${API_BASE_URL}/company/${companyId}/allowance-types/${editingItem.id}`
      : `${API_BASE_URL}/company/${companyId}/allowance-types`;

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
        toast.success(isEditing ? "Allowance updated" : "Allowance created");
        setOpenDialog(false);
        setEditingItem(null);
        fetchAllowances();
      } else {
        const err = await response.json();
        toast.error(err.error || "Operation failed");
      }
    } catch (error) {
      toast.error("Failed to save allowance");
      console.error("Save error:", error);
    }
  };

  const handleDelete = async (id: string) => {
    const token = session?.access_token;

    try {
      const response = await fetch(
        `${API_BASE_URL}/company/${companyId}/allowance-types/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        toast.success("Allowance deleted successfully");
        fetchAllowances();
      } else {
        const err = await response.json();
        toast.error(err.error || "Could not delete allowance");
      }
    } catch (error) {
      toast.error("Failed to delete allowance");
    }
  };

  const columns: ColumnDef<AllowanceType>[] = [
    {
      accessorKey: "name",
      header: "Allowance",
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
      header: "Type",
      cell: ({ row }) => (
        <span
          className={cn(
            "text-xs font-medium px-2.5 py-1.5 rounded-md",
            row.original.is_cash
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-purple-50 text-purple-700 border border-purple-200"
          )}
        >
          {row.original.is_cash ? "Cash" : "Non-Cash"}
        </span>
      ),
    },
    {
      header: "Tax Status",
      cell: ({ row }) => (
        <span
          className={cn(
            "text-xs font-medium px-2.5 py-1.5 rounded-md",
            row.original.is_taxable
              ? "bg-amber-50 text-amber-700 border border-amber-200"
              : "bg-slate-50 text-slate-600 border border-slate-200"
          )}
        >
          {row.original.is_taxable ? "Taxable" : "Non-Taxable"}
        </span>
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
          <div className="flex justify-end gap-1">
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
          className="bg-[#1F3A8A] hover:bg-[#162a63] cursor-pointer rounded-sm shadow-none h-10 px-4 text-sm font-medium transition-all hover:-translate-y-0.5"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Allowance
        </Button>
      </div>

      <div className="border border-slate-200 rounded-lg px-2 overflow-hidden bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50">
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="hover:bg-transparent border-b border-slate-200">
                {hg.headers.map((header) => (
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
                      Loading allowances...
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
                        No allowances configured
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Get started by adding your first allowance type
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
                      Add your first allowance
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AllowanceDialog
        open={openDialog}
        onOpenChange={setOpenDialog}
        initialData={editingItem}
        onSave={handleSave}
      />

      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent className="rounded-lg border-slate-200 shadow-lg max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg text-slate-900">
              Delete allowance type?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-500">
              This action cannot be undone. This will permanently delete the{" "}
              <span className="font-medium text-slate-700">{deleteItem?.name}</span>{" "}
              allowance and may affect existing payroll calculations.
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
              Delete Allowance
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
  initialData: AllowanceType | null;
  onSave: (values: Omit<AllowanceType, "id">) => void;
}

function AllowanceDialog({ open, onOpenChange, initialData, onSave }: DialogProps) {
  const nonCashOptions = [
    { label: "Car Benefit", value: "CAR" },
    { label: "Meal Benefit", value: "MEAL" },
    { label: "Housing Benefit (Quarters)", value: "HOUSING" },
    { label: "Other", value: "OTHER" },
  ];

  const [isCash, setIsCash] = React.useState(true);
  const [selectedCode, setSelectedCode] = React.useState("");
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [isTaxable, setIsTaxable] = React.useState(true);
  const [hasMaximum, setHasMaximum] = React.useState(false);
  const [maximumValue, setMaximumValue] = React.useState<number | "">("");

  React.useEffect(() => {
    if (initialData) {
      setIsCash(initialData.is_cash);
      setSelectedCode(initialData.code);
      setName(initialData.name);
      setDescription(initialData.description || "");
      setIsTaxable(initialData.is_taxable);
      setHasMaximum(initialData.has_maximum_value);
      setMaximumValue(initialData.maximum_value ?? "");
    } else {
      resetForm();
    }
  }, [initialData, open]);

  const resetForm = () => {
    setIsCash(true);
    setSelectedCode("");
    setName("");
    setDescription("");
    setIsTaxable(true);
    setHasMaximum(false);
    setMaximumValue("");
  };

  React.useEffect(() => {
    if (isCash) {
      setIsTaxable(true);
      setSelectedCode("CASH");
    } else {
      setSelectedCode("");
    }
  }, [isCash]);

  React.useEffect(() => {
    if (!isCash) {
      if (selectedCode === "CAR" || selectedCode === "HOUSING") {
        setIsTaxable(true);
      }
    }
  }, [selectedCode, isCash]);

  const handleSubmit = () => {
    // Validation
    if (!isCash && !selectedCode) {
      toast.error("Please select a benefit type");
      return;
    }

    if (!isCash && selectedCode === "OTHER" && !name.trim()) {
      toast.error("Please enter a benefit name");
      return;
    }

    if (isCash && !name.trim()) {
      toast.error("Please enter an allowance name");
      return;
    }

    if (hasMaximum && (!maximumValue || Number(maximumValue) <= 0)) {
      toast.error("Please enter a valid maximum amount");
      return;
    }

    const finalName = isCash
      ? name.trim()
      : selectedCode === "OTHER"
      ? name.trim()
      : nonCashOptions.find((o) => o.value === selectedCode)?.label || "";

    onSave({
      name: finalName,
      description: description.trim() || null,
      is_cash: isCash,
      is_taxable: isTaxable,
      has_maximum_value: hasMaximum,
      maximum_value: hasMaximum ? Number(maximumValue) : null,
      code: isCash ? "CASH" : selectedCode,
    });

    onOpenChange(false);
    resetForm();
  };

  const isLocked = !isCash && (selectedCode === "CAR" || selectedCode === "HOUSING");

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
            {initialData ? "Edit Allowance" : "Add New Allowance"}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500 mt-1">
            {initialData
              ? "Update the allowance type details below"
              : "Configure a new allowance type for your organization"}
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Cash/Non-Cash Toggle */}
          <div className="flex gap-2 p-1 bg-slate-50 rounded-lg border border-slate-200">
            <Button
              type="button"
              variant={isCash ? "default" : "ghost"}
              onClick={() => setIsCash(true)}
              className={cn(
                "flex-1 h-9 text-sm font-medium rounded-md transition-all",
                isCash
                  ? "bg-white text-slate-900 border border-slate-300 shadow-sm hover:bg-white"
                  : "bg-transparent text-slate-500 hover:bg-white hover:text-slate-900 border-transparent"
              )}
            >
              Cash Allowance
            </Button>
            <Button
              type="button"
              variant={!isCash ? "default" : "ghost"}
              onClick={() => setIsCash(false)}
              className={cn(
                "flex-1 h-9 text-sm font-medium rounded-md transition-all",
                !isCash
                  ? "bg-white text-slate-900 border border-slate-300 shadow-sm hover:bg-white"
                  : "bg-transparent text-slate-500 hover:bg-white hover:text-slate-900 border-transparent"
              )}
            >
              Non-Cash Benefit
            </Button>
          </div>

          {/* Cash Flow */}
          {isCash && (
            <>
              <BorderFloatingField
                label="Allowance Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <BorderFloatingField
                label="Description (Optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              <div className="bg-blue-50/80 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700 flex items-center gap-2">
                  <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  Cash allowances are always taxable under KRA regulations
                </p>
              </div>
            </>
          )}

          {/* Non-Cash Flow */}
          {!isCash && (
            <>
              <BorderFloatingSelect
                label="Benefit Type"
                options={nonCashOptions}
                value={selectedCode}
                onChange={setSelectedCode}
                required
              />

              {selectedCode === "OTHER" && (
                <BorderFloatingField
                  label="Benefit Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              )}

              {selectedCode && selectedCode !== "OTHER" && (
                <BorderFloatingField
                  label="Description (Optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              )}

              {selectedCode === "MEAL" && (
                <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs text-amber-700 flex items-center gap-2">
                    <span className="inline-block w-1.5 h-1.5 bg-amber-500 rounded-full" />
                    First KES 5,000 is tax-exempt. Excess amounts are taxable
                  </p>
                </div>
              )}

              {selectedCode === "CAR" && (
                <div className="bg-blue-50/80 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-700 flex items-center gap-2">
                    <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full" />
                    Car benefit is taxable based on KRA prescribed rates
                  </p>
                </div>
              )}
            </>
          )}

          {/* Taxable Toggle */}
          <div
            className={cn(
              "flex items-center justify-between border rounded-lg p-4 bg-white",
              isCash || isLocked ? "border-slate-200 bg-slate-50/50" : "border-slate-200"
            )}
          >
            <div className="space-y-0.5">
              <Label className="text-sm font-medium text-slate-700">
                Taxable
              </Label>
              <p className="text-xs text-slate-500">
                {isCash || isLocked
                  ? "Locked based on allowance type"
                  : "Toggle if this benefit is taxable"}
              </p>
            </div>
            <Switch
              checked={isTaxable}
              onCheckedChange={setIsTaxable}
              disabled={isCash || isLocked}
              className="data-[state=checked]:bg-[#1F3A8A]"
            />
          </div>

          {/* Maximum Limit Toggle */}
          <div className="flex items-center justify-between border border-slate-200 rounded-lg p-4 bg-white">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium text-slate-700">
                Has Maximum Limit
              </Label>
              <p className="text-xs text-slate-500">
                Apply a monthly cap to this allowance
              </p>
            </div>
            <Switch
              checked={hasMaximum}
              onCheckedChange={setHasMaximum}
              className="data-[state=checked]:bg-[#1F3A8A]"
            />
          </div>

          {/* Maximum Value */}
          {hasMaximum && (
            <BorderFloatingField
              label="Maximum Monthly Amount (KES)"
              type="number"
              value={maximumValue}
              onChange={(e) =>
                setMaximumValue(e.target.value ? Number(e.target.value) : "")
              }
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
            {initialData ? "Update" : "Save"} Allowance
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}