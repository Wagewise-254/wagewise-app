// src/components/dashboard/employee/ImportEmployeesDialog.tsx - Updated

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone"; // For drag and drop
import axios from "axios";
import { toast } from "sonner";
import { Loader2, UploadCloud, FileText } from "lucide-react"; // Icons

// Import Shadcn UI components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // **NEW: Import Select components**

import { API_BASE_URL } from "@/config";
import useAuthStore from "@/store/authStore";

interface ImportEmployeesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: () => void; // Optional callback after successful import
}

const ImportEmployeesDialog: React.FC<ImportEmployeesDialogProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const { accessToken } = useAuthStore();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importError, setImportError] = useState<string | null>(null);
  const [importAction, setImportAction] = useState<"new" | "update">("new"); // Default to 'new'
  // --- Dropzone Setup ---
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const uploadedFile = acceptedFiles[0];
      const allowedTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
        "application/vnd.ms-excel", // .xls
        "text/csv", // .csv
      ];
      if (allowedTypes.includes(uploadedFile.type)) {
        setFile(uploadedFile);
        setImportError(null); // Clear previous errors
      } else {
        setFile(null);
        setImportError(
          "Invalid file type. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file."
        );
        toast.error("Invalid file type. Only Excel or CSV files are allowed.");
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
  });
  // --- Handle File Upload to Backend ---
  const handleUpload = async () => {
    if (!file) {
      setImportError("Please select a file to upload.");
      toast.error("No file selected.");
      return;
    }

    if (!accessToken) {
      setImportError("Authentication token is missing. Please log in again.");
      toast.error("Authentication token missing.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setImportError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("import_action", importAction);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/employees/import`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadProgress(percentCompleted);
            }
          },
        }
      );

      //console.log("Import successful:", response.data);
      toast.success(
        response.data.message || "Employee data imported successfully!"
      );

      onImportSuccess?.();
      handleCloseDialog(); // Close the dialog on success
    } catch (err: unknown) {
      console.error("Import error:", err);
      setIsUploading(false); // Stop loading

      if (
        axios.isAxiosError(err) &&
        err.response &&
        typeof err.response.data === "object"
      ) {
        interface ErrorResponse {
          error?: string;
          message?: string;
          details?: Record<string, unknown>; // To capture backend validation details
        }
        const backendError = err.response.data as ErrorResponse;
        const backendErrorMessage =
          backendError.error ||
          backendError.message ||
          "Failed to import employee data.";

        setImportError(backendErrorMessage);
        toast.error(backendErrorMessage);

        if (backendError.details) {
          console.error("Import Details:", backendError.details);
          // You might want to display these details to the user in the UI
        }
      } else {
        const genericErrorMessage =
          "An unexpected error occurred during import.";
        setImportError(genericErrorMessage);
        toast.error(genericErrorMessage);
      }
    }
  };

  // --- Handle Dynamic Template Download ---
  const handleDownloadTemplate = async () => {
    if (!accessToken) {
      toast.error("Authentication token missing. Cannot download template.");
      return;
    }

    try {
      toast.info("Preparing template download...");

      const a = document.createElement("a");
      a.href = "/assets/employee_import_template.xlsx";
      a.download = "employee_import_template.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast.success("Excel template downloaded successfully!");
    } catch (error) {
      console.error("Error downloading template:", error);
      toast.error(
        "An unexpected error occurred while downloading the template."
      );
    }
  };
  // --- End Handle Dynamic Template Download ---

  // --- Reset state when dialog closes ---
  const handleCloseDialog = () => {
    setFile(null);
    setIsUploading(false);
    setUploadProgress(0);
    setImportError(null);
    setImportAction("new"); // **NEW: Reset import action on close**
    onClose(); // Call the parent's onClose
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
      <DialogContent className="sm:max-w-[425px] md:max-w-lg flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Employees</DialogTitle>
          <DialogDescription>
            Streamline your employee data management by importing from an Excel
            or CSV file.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto pr-4 -mr-4 space-y-4 py-2">
          {/* **NEW SECTION: Template Download** */}
          <div className="mb-4">
            <Label className="text-sm font-medium">
              Step 1: Download Template
            </Label>
            <p className="text-xs text-gray-500 mb-2">
              Use this template to ensure correct column headers and data
              format.
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleDownloadTemplate}
              disabled={isUploading}
            >
              <FileText className="mr-2 h-4 w-4" />
              Download Employee Excel Template
            </Button>
          </div>

          {/* **NEW SECTION: Import Action Selection** */}
          <div className="mb-4">
            <Label htmlFor="import-action" className="text-sm font-medium">
              Step 2: Choose Import Action
            </Label>
            <Select
              value={importAction}
              onValueChange={(value: "new" | "update") =>
                setImportAction(value)
              }
              disabled={isUploading}
            >
              <SelectTrigger id="import-action" className="w-full mt-2">
                <SelectValue placeholder="Select import action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">Add New Employees</SelectItem>
                <SelectItem value="update">
                  Update Existing Employees
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              {importAction === "new"
                ? "Creates new records. Duplicates (by employee number) will be skipped."
                : "Updates existing records based on employee number. New records are skipped."}
            </p>
          </div>

          {/* **UPDATED SECTION: File Dropzone Area with correct label and disabled state** */}
          <div className="mb-4">
            <Label className="text-sm font-medium">
              Step 3: Upload Your File
            </Label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors mt-2 ${
                isDragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              } ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <input {...getInputProps()} disabled={isUploading} />
              <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
              {isDragActive ? (
                <p className="mt-2 text-gray-600">Drop the file here ...</p>
              ) : (
                <p className="mt-2 text-gray-600">
                  Drag 'n' drop an Excel or CSV file here, or click to select
                  file
                </p>
              )}
              {file && (
                <p className="mt-2 text-sm text-gray-800">
                  Selected file: **{file.name}**
                </p>
              )}
            </div>
          </div>

          {/* Error Message */}
          {importError && (
            <p className="text-red-500 text-sm mt-2 text-center">
              {importError}
            </p>
          )}
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="mt-4">
            <Label>Upload progress:</Label>
            <Progress value={uploadProgress} className="w-full mt-2" />
            <p className="text-center text-sm text-gray-600 mt-1">
              {uploadProgress}%
            </p>
          </div>
        )}

        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={handleCloseDialog}
            disabled={isUploading}
          >
            Cancel
          </Button>
          {/* **UPDATED Button text based on importAction** */}
          <Button onClick={handleUpload} disabled={!file || isUploading}>
            {isUploading ? (
              <Loader2 className="animate-spin mr-2 h-4 w-4" />
            ) : null}
            {importAction === "new" ? "Upload and Add" : "Upload and Update"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportEmployeesDialog;
