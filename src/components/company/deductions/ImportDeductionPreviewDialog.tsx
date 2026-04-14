// src/components/company/benefits/ImportDeductionPreviewDialog.tsx
import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { API_BASE_URL } from "@/config";
import { useAuthStore } from "@/stores/authStore";
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  Download,
  CloudUpload,
  XCircle,
  FileText,
  Users,
  Building,
  Briefcase,
  User,
} from "lucide-react";
import axios from "axios";
import { useDropzone } from "react-dropzone";

interface ImportPreviewProps {
  companyId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface DeductionImportData {
  deduction_type_name: string;
  deduction_type_id?: string;
  applies_to: string;
  recipient_name?: string;
  recipient_display?: string;
  employee_id?: string | null;
  employee_number?: string;
  employee_full_name?: string;
  department_id?: string | null;
  department_name?: string;
  sub_department_id?: string | null;
  sub_department_name?: string;
  job_title_id?: string | null;
  job_title_name?: string;
  value: number;
  calculation_type: "FIXED" | "PERCENTAGE";
  is_recurring: boolean;
  start_month: string;
  start_year: number;
  number_of_months?: number | null;
  metadata?: Record<string, unknown>;
  row?: number;
}

interface PreviewValidItem {
  row: number;
  data: DeductionImportData;
}

interface PreviewDuplicateItem {
  row: number;
  data: DeductionImportData;
  type: string;
}

interface PreviewErrorItem {
  row: number;
  type: string;
  message: string;
}

interface PreviewData {
  summary: {
    total: number;
    valid: number;
    duplicates: number;
    errors: number;
  };
  valid: PreviewValidItem[];
  duplicates: PreviewDuplicateItem[];
  errors: PreviewErrorItem[];
}

// Helper to get recipient icon
const getRecipientIcon = (appliesTo: string, className = "h-3 w-3") => {
  switch (appliesTo) {
    case "INDIVIDUAL":
      return <User className={className} />;
    case "COMPANY":
      return <Building className={className} />;
    case "DEPARTMENT":
    case "SUB_DEPARTMENT":
      return <Users className={className} />;
    case "JOB_TITLE":
      return <Briefcase className={className} />;
    default:
      return null;
  }
};

// Helper to get recipient display
const getRecipientDisplay = (data: DeductionImportData) => {
  switch (data.applies_to) {
    case "INDIVIDUAL":
      if (data.employee_full_name && data.employee_number) {
        return `${data.employee_full_name} (${data.employee_number})`;
      }
      return data.recipient_name || "Unknown Employee";
    case "COMPANY":
      return "All Employees";
    case "DEPARTMENT":
      return (
        data.department_name || data.recipient_name || "Unknown Department"
      );
    case "SUB_DEPARTMENT":
      return (
        data.sub_department_name ||
        data.recipient_name ||
        "Unknown Sub-department"
      );
    case "JOB_TITLE":
      return data.job_title_name || data.recipient_name || "Unknown Job Title";
    default:
      return data.recipient_name || "N/A";
  }
};

export default function ImportDeductionPreviewDialog({
  companyId,
  isOpen,
  onClose,
  onSuccess,
}: ImportPreviewProps) {
  const { session } = useAuthStore();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedOverrides, setSelectedOverrides] = useState<Set<string>>(
    new Set(),
  );
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [step, setStep] = useState<"upload" | "preview">("upload");
  const [activeTab, setActiveTab] = useState<"valid" | "duplicates" | "errors">(
    "valid",
  );

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setPreview(null);
      setSelectedOverrides(new Set());
      setSkipDuplicates(true);
      setStep("upload");
      setLoading(false);
      setImporting(false);
      setActiveTab("valid");
    }
  }, [isOpen]);

  const analyzeFile = useCallback(
    async (fileToAnalyze: File) => {
      setLoading(true);
      const formData = new FormData();
      formData.append("file", fileToAnalyze);

      try {
        const response = await axios.post(
          `${API_BASE_URL}/company/${companyId}/deductions/import/preview`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${session?.access_token}`,
              "Content-Type": "multipart/form-data",
            },
          },
        );
        setPreview(response.data);
        setStep("preview");

        // Auto-select duplicates tab if there are duplicates
        if (response.data.duplicates?.length > 0) {
          setActiveTab("duplicates");
        }
      } catch (error) {
        console.error("Preview error:", error);
        if (axios.isAxiosError(error) && error.response) {
          toast.error(error.response.data.error || "Failed to analyze file");
        } else {
          toast.error("Failed to analyze file. Please try again.");
        }
        setFile(null);
      } finally {
        setLoading(false);
      }
    },
    [companyId, session],
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0]);
        analyzeFile(acceptedFiles[0]);
      }
    },
    [analyzeFile],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
    },
    multiple: false,
  });

  const handleDownloadTemplate = async () => {
    if (!companyId) {
      toast.error("Company ID is missing.");
      return;
    }

    try {
      const token = session?.access_token;
      if (!token) {
        toast.error("Authentication token not found. Please log in again.");
        return;
      }

      toast.info("Downloading template...");
      const response = await axios.get(
        `${API_BASE_URL}/company/${companyId}/deductions/template`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: "blob",
        },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Deduction_Import_Template.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Template downloaded successfully.");
    } catch (error) {
      console.error("Error downloading template:", error);
      toast.error("Failed to download template. Please try again.");
    }
  };

  const handleImport = async () => {
    if (!preview) return;

    setImporting(true);
    try {
      // Prepare deductions - include valid records
      const deductionsToImport = preview.valid.map((v) => ({
        ...v.data,
        row: v.row,
      }));

      // If skipDuplicates is false and we have selected overrides, include them
      let allDeductions = [...deductionsToImport];
      const overrideRowIds = Array.from(selectedOverrides);

      if (!skipDuplicates && overrideRowIds.length > 0) {
        // Add the selected duplicates to be overridden
        const duplicatesToImport = preview.duplicates
          .filter((d) => overrideRowIds.includes(d.row.toString()))
          .map((d) => ({ ...d.data, row: d.row }));

        allDeductions = [...allDeductions, ...duplicatesToImport];
      }

      const response = await axios.post(
        `${API_BASE_URL}/company/${companyId}/deductions/import`,
        {
          deductions: allDeductions,
          overrideIds: overrideRowIds, // Send the row IDs that should override
          skipDuplicates: skipDuplicates, // Skip non-selected duplicates
        },
        {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            "Content-Type": "application/json",
          },
        },
      );

      toast.success(response.data.message);

      // Show detailed results
      if (response.data.results) {
        const { updated, errors } = response.data.results;
        if (updated && updated.length > 0) {
          toast.success(`${updated.length} deduction(s) updated successfully`);
        }
        if (errors && errors.length > 0) {
          console.error("Import errors:", errors);
          toast.error(`${errors.length} error(s) occurred during import`);
        }
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import deductions");
    } finally {
      setImporting(false);
    }
  };

  const toggleOverride = (rowNumber: number) => {
    const newSet = new Set(selectedOverrides);
    const rowStr = rowNumber.toString();
    if (newSet.has(rowStr)) {
      newSet.delete(rowStr);
    } else {
      newSet.add(rowStr);
    }
    setSelectedOverrides(newSet);
  };

  const selectAllOverrides = () => {
    if (!preview) return;
    const allRows = preview.duplicates.map((d) => d.row.toString());
    if (selectedOverrides.size === allRows.length) {
      setSelectedOverrides(new Set());
    } else {
      setSelectedOverrides(new Set(allRows));
    }
  };

  const resetAndClose = () => {
    setFile(null);
    setPreview(null);
    setSelectedOverrides(new Set());
    setSkipDuplicates(true);
    setStep("upload");
    onClose();
  };

  // Render valid records table
  const renderValidRecords = () => {
    if (!preview?.valid.length) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
          <CheckCircle className="h-12 w-12 mb-2" />
          <p className="text-sm">No valid records to import</p>
        </div>
      );
    }

    return (
      <ScrollArea className="h-[calc(100vh-420px)]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white border-b z-10">
            <tr className="bg-slate-50">
              <th className="text-left py-3 px-3 text-xs font-medium text-slate-500 w-12">
                #
              </th>
              <th className="text-left py-3 px-3 text-xs font-medium text-slate-500">
                Deduction Type
              </th>
              <th className="text-left py-3 px-3 text-xs font-medium text-slate-500">
                Applies To
              </th>
              <th className="text-left py-3 px-3 text-xs font-medium text-slate-500">
                Recipient
              </th>
              <th className="text-right py-3 px-3 text-xs font-medium text-slate-500">
                Value
              </th>
              <th className="text-left py-3 px-3 text-xs font-medium text-slate-500">
                Period
              </th>
            </tr>
          </thead>
          <tbody>
            {preview.valid.map((item, idx) => (
              <tr
                key={item.row}
                className="border-b hover:bg-slate-50 transition-colors"
              >
                <td className="py-2 px-3 text-slate-400 text-xs">{idx + 1}</td>
                <td className="py-2 px-3">
                  <span className="font-medium text-slate-800">
                    {item.data.deduction_type_name}
                  </span>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {item.data.calculation_type}
                  </Badge>
                </td>
                <td className="py-2 px-3">
                  <div className="flex items-center gap-1">
                    {getRecipientIcon(item.data.applies_to)}
                    <span className="text-xs text-slate-600">
                      {item.data.applies_to.replace("_", " ")}
                    </span>
                  </div>
                </td>
                <td className="py-2 px-3">
                  <div className="flex flex-col">
                    <span className="text-sm text-slate-700">
                      {getRecipientDisplay(item.data)}
                    </span>
                    {item.data.applies_to === "INDIVIDUAL" &&
                      item.data.employee_number && (
                        <span className="text-xs text-slate-400">
                          ID: {item.data.employee_number}
                        </span>
                      )}
                  </div>
                </td>
                <td className="py-2 px-3 text-right">
                  <span className="font-mono font-medium">
                    {item.data.value.toLocaleString()}
                    {item.data.calculation_type === "PERCENTAGE" ? "%" : ""}
                  </span>
                </td>
                <td className="py-2 px-3 text-slate-500 text-xs">
                  {item.data.start_month} {item.data.start_year}
                  {!item.data.is_recurring &&
                    item.data.number_of_months &&
                    ` → ${item.data.number_of_months} month${item.data.number_of_months !== 1 ? "s" : ""}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollArea>
    );
  };

  // Render duplicates with override options
  const renderDuplicates = () => {
    if (!preview?.duplicates.length) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
          <CheckCircle className="h-12 w-12 mb-2" />
          <p className="text-sm">No duplicate records found</p>
        </div>
      );
    }

    return (
      <>
        <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={
                    selectedOverrides.size === preview.duplicates.length &&
                    preview.duplicates.length > 0
                  }
                  onCheckedChange={selectAllOverrides}
                  id="select-all"
                  className="border-amber-400 data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
                />
                <label
                  htmlFor="select-all"
                  className="text-sm text-slate-700 cursor-pointer"
                >
                  Select all to override
                </label>
              </div>
              <div className="h-4 w-px bg-amber-300" />
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">
                  {selectedOverrides.size} of {preview.duplicates.length}{" "}
                  selected
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={skipDuplicates}
                  onCheckedChange={(checked) =>
                    setSkipDuplicates(checked as boolean)
                  }
                  id="skip-duplicates"
                />
                <label
                  htmlFor="skip-duplicates"
                  className="text-sm text-slate-700 cursor-pointer"
                >
                  Skip duplicates (don't import)
                </label>
              </div>
              {!skipDuplicates && selectedOverrides.size === 0 && (
                <span className="text-xs text-amber-600">
                  ⚠️ Select rows to override above
                </span>
              )}
            </div>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-480px)]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white border-b z-10">
              <tr className="bg-slate-50">
                <th className="text-left py-3 px-3 w-12">Override</th>
                <th className="text-left py-3 px-3 text-xs font-medium text-slate-500">
                  Deduction Type
                </th>
                <th className="text-left py-3 px-3 text-xs font-medium text-slate-500">
                  Recipient
                </th>
                <th className="text-right py-3 px-3 text-xs font-medium text-slate-500">
                  Current Value
                </th>
                <th className="text-right py-3 px-3 text-xs font-medium text-slate-500">
                  New Value
                </th>
                <th className="text-left py-3 px-3 text-xs font-medium text-slate-500">
                  Period
                </th>
              </tr>
            </thead>
            <tbody>
              {preview.duplicates.map((item) => (
                <tr
                  key={item.row}
                  className="border-b hover:bg-slate-50 transition-colors"
                >
                  <td className="py-2 px-3">
                    <Checkbox
                      checked={selectedOverrides.has(item.row.toString())}
                      onCheckedChange={() => toggleOverride(item.row)}
                      className="border-amber-400 data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <span className="font-medium text-slate-800">
                      {item.data.deduction_type_name}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex flex-col">
                      <span className="text-sm text-slate-700">
                        {getRecipientDisplay(item.data)}
                      </span>
                      {item.data.applies_to === "INDIVIDUAL" &&
                        item.data.employee_number && (
                          <span className="text-xs text-slate-400">
                            {item.data.employee_number}
                          </span>
                        )}
                    </div>
                  </td>
                  <td className="py-2 px-3 text-right">
                    <span className="text-slate-400 line-through text-sm">
                      {item.data.value?.toLocaleString() || "—"}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right">
                    <span className="font-mono font-medium text-amber-700">
                      {item.data.value.toLocaleString()}
                      {item.data.calculation_type === "PERCENTAGE" ? "%" : ""}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-slate-500 text-xs">
                    {item.data.start_month} {item.data.start_year}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea>

        {!skipDuplicates && selectedOverrides.size > 0 && (
          <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
            <strong>{selectedOverrides.size}</strong> deduction(s) will be
            updated with new values. Others will be skipped.
          </div>
        )}
        {skipDuplicates && (
          <div className="mt-3 p-2 bg-slate-50 rounded text-xs text-slate-500">
            All duplicates will be skipped. Uncheck "Skip duplicates" and select
            rows to override existing deductions.
          </div>
        )}
      </>
    );
  };

  // Render errors
  const renderErrors = () => {
    if (!preview?.errors.length) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
          <CheckCircle className="h-12 w-12 mb-2" />
          <p className="text-sm">No errors found</p>
        </div>
      );
    }

    return (
      <ScrollArea className="h-[calc(100vh-420px)]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white border-b z-10">
            <tr className="bg-slate-50">
              <th className="text-left py-3 px-3 text-xs font-medium text-slate-500 w-16">
                Row
              </th>
              <th className="text-left py-3 px-3 text-xs font-medium text-slate-500">
                Error Type
              </th>
              <th className="text-left py-3 px-3 text-xs font-medium text-slate-500">
                Message
              </th>
            </tr>
          </thead>
          <tbody>
            {preview.errors.map((error, idx) => (
              <tr
                key={idx}
                className="border-b hover:bg-red-50/50 transition-colors"
              >
                <td className="py-2 px-3 text-slate-500 text-xs font-mono">
                  {error.row}
                </td>
                <td className="py-2 px-3">
                  <Badge variant="destructive" className="text-xs">
                    {error.type.replace(/_/g, " ").toUpperCase()}
                  </Badge>
                </td>
                <td className="py-2 px-3 text-red-600 text-sm">
                  {error.message}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollArea>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-[#7F5EFD]" />
            Bulk Import Deductions
          </DialogTitle>
          <DialogDescription>
            Upload an Excel file with deduction assignments. The system will
            validate and preview before importing.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {step === "upload" ? (
            <div className="p-6">
              {/* Template Download Section */}
              <div className="mb-6">
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-[#7F5EFD]/10 flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-[#7F5EFD]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-slate-800 mb-1">
                        Step 1: Download Template
                      </h3>
                      <p className="text-xs text-slate-500 mb-3">
                        Get the Excel template with dropdowns for Deductions
                        types, departments, and more
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadTemplate}
                        className="text-xs"
                      >
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                        Download Template
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload Section */}
              <div>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                      <CloudUpload className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-slate-800 mb-1">
                        Step 2: Upload Filled Template
                      </h3>
                      <p className="text-xs text-slate-500 mb-3">
                        Upload your completed Excel file for validation
                      </p>

                      <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors duration-200 ${
                          isDragActive
                            ? "border-[#7F5EFD] bg-[#7F5EFD]/5"
                            : "border-slate-300 hover:border-[#7F5EFD]"
                        }`}
                      >
                        <input {...getInputProps()} />
                        <div className="flex flex-col items-center">
                          {file && loading ? (
                            <>
                              <Loader2 className="h-8 w-8 animate-spin text-[#7F5EFD] mb-2" />
                              <p className="text-sm font-medium text-slate-600">
                                Analyzing file...
                              </p>
                            </>
                          ) : file && !loading ? (
                            <>
                              <CheckCircle className="h-8 w-8 text-emerald-500 mb-2" />
                              <p className="text-sm font-medium text-slate-800">
                                {file.name}
                              </p>
                              <p className="text-xs text-slate-400 mt-1">
                                Click to change file or drop another
                              </p>
                            </>
                          ) : (
                            <>
                              <CloudUpload className="h-8 w-8 text-slate-400 mb-2" />
                              <p className="text-sm font-medium text-slate-600">
                                Drag & drop your Excel file here
                              </p>
                              <p className="text-xs text-slate-400 mt-1">
                                or click to browse
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            preview && (
              <div className="flex flex-col h-full">
                {/* Summary Cards - More Compact */}
                <div className="grid grid-cols-4 gap-3 p-4 border-b shrink-0">
                  <div className="bg-slate-50 rounded-lg p-2 text-center">
                    <p className="text-xl font-bold text-slate-700">
                      {preview.summary.total}
                    </p>
                    <p className="text-xs text-slate-500">Total Rows</p>
                  </div>
                  <div
                    className={`rounded-lg p-2 text-center cursor-pointer transition-all ${activeTab === "valid" ? "bg-emerald-100 ring-2 ring-emerald-400" : "bg-emerald-50 hover:bg-emerald-100"}`}
                    onClick={() => setActiveTab("valid")}
                  >
                    <p className="text-xl font-bold text-emerald-600">
                      {preview.summary.valid}
                    </p>
                    <p className="text-xs text-emerald-600">Valid</p>
                  </div>
                  <div
                    className={`rounded-lg p-2 text-center cursor-pointer transition-all ${activeTab === "duplicates" ? "bg-amber-100 ring-2 ring-amber-400" : "bg-amber-50 hover:bg-amber-100"}`}
                    onClick={() =>
                      preview.duplicates.length > 0 &&
                      setActiveTab("duplicates")
                    }
                  >
                    <p className="text-xl font-bold text-amber-600">
                      {preview.summary.duplicates}
                    </p>
                    <p className="text-xs text-amber-600">Duplicates</p>
                    {preview.summary.duplicates > 0 && (
                      <Badge
                        variant="outline"
                        className="mt-1 text-[10px] bg-amber-200/50"
                      >
                        Override Available
                      </Badge>
                    )}
                  </div>
                  <div
                    className={`rounded-lg p-2 text-center cursor-pointer transition-all ${activeTab === "errors" ? "bg-red-100 ring-2 ring-red-400" : "bg-red-50 hover:bg-red-100"}`}
                    onClick={() =>
                      preview.errors.length > 0 && setActiveTab("errors")
                    }
                  >
                    <p className="text-xl font-bold text-red-600">
                      {preview.summary.errors}
                    </p>
                    <p className="text-xs text-red-600">Errors</p>
                  </div>
                </div>

                {/* Error Alert - Only show if there are errors */}
                {preview.summary.errors > 0 && activeTab !== "errors" && (
                  <div className="px-4 pt-3 shrink-0">
                    <Alert variant="destructive" className="py-2">
                      <AlertCircle className="h-3 w-3" />
                      <AlertDescription className="text-xs">
                        {preview.summary.errors} row(s) contain errors and will
                        be skipped during import.
                        <Button
                          variant="link"
                          className="text-xs h-auto p-0 ml-2 text-red-700"
                          onClick={() => setActiveTab("errors")}
                        >
                          View errors
                        </Button>
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                {/* Main Content Area */}
                <div className="flex-1 overflow-hidden px-4 pb-4">
                  {activeTab === "valid" && renderValidRecords()}
                  {activeTab === "duplicates" && renderDuplicates()}
                  {activeTab === "errors" && renderErrors()}
                </div>
              </div>
            )
          )}
        </div>

        <DialogFooter className="p-4 pt-3 border-t bg-slate-50/50 shrink-0">
          <Button
            variant="outline"
            onClick={resetAndClose}
            disabled={importing}
            size="sm"
          >
            {step === "preview" ? "Cancel" : "Close"}
          </Button>
          {step === "preview" && (
            <Button
              onClick={handleImport}
              disabled={
                (!preview?.valid.length && selectedOverrides.size === 0) ||
                importing
              }
              className="bg-[#7F5EFD] hover:bg-[#6a4ad3]"
              size="sm"
            >
              {importing ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-3 w-3" />
                  Import {preview?.valid.length || 0} Row(s)
                  {selectedOverrides.size > 0 &&
                    ` + ${selectedOverrides.size} Override(s)`}
                </>
              )}
            </Button>
          )}
          {step === "upload" && file && !loading && (
            <Button
              variant="outline"
              onClick={() => setFile(null)}
              className="text-red-600 hover:text-red-700"
              size="sm"
            >
              <XCircle className="mr-2 h-3 w-3" />
              Clear File
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
