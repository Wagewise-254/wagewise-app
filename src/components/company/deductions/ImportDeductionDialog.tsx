// src/components/company/payroll/allowances/ImportAllowanceDialog.tsx
import React, { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { API_BASE_URL } from "@/config";
import { useAuthStore } from "@/stores/authStore";
import { Loader2, Download, CheckCircle, CloudUpload } from "lucide-react";
import { useParams } from "react-router-dom";
import axios from "axios";

interface ImportDeductionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

const ImportDeductionDialog: React.FC<ImportDeductionDialogProps> = ({
  isOpen,
  onClose,
  onUpdated
}) => {
  const { companyId } = useParams();
  const { session } = useAuthStore();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    },
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
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Deduction_Import_Template.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Template downloaded successfully.");
    } catch (error) {
      console.error("Error downloading template:", error);
      toast.error("Failed to download template. Please try again.");
    }
  };

  const handleUpload = async () => {
    if (!file || !companyId) {
      toast.error("No file selected or company ID is missing.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = session?.access_token;
      if (!token) {
        toast.error("Authentication token not found. Please log in again.");
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/company/${companyId}/deductions/import`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success(response.data.message);
      onUpdated(); // Refresh the list of allowances after a successful import
      onClose();
    } catch (error) {
      console.error("Upload error:", error);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.error || "Failed to import deductions.");
        if (error.response.data.details) {
            error.response.data.details.forEach((detail: string) => {
                toast.error(detail);
                console.error(detail);
            });
        }
      } else {
        toast.error("Failed to import deductions. Please try again.");
      }
    } finally {
      setIsUploading(false);
      setFile(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
         <DialogTitle>Import Deductions (Month/Year Based)</DialogTitle>
          <DialogDescription>
            Download the template, fill it with deduction details including the **Start Month/Year** and **Is Recurring** status, and upload the file.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={handleDownloadTemplate}
              className="flex items-center cursor-pointer gap-2"
            >
              <Download className="h-4 w-4 " /> Download Template
            </Button>
          </div>
          <div className="grid gap-2">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors duration-200 ${
                isDragActive ? "border-primary" : "border-gray-300"
              }`}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center">
                {file ? (
                  <>
                    <CheckCircle className="h-10 w-10 text-green-500 mb-2" />
                    <p className="text-sm font-medium">
                      {file.name} ready to upload.
                    </p>
                  </>
                ) : (
                  <>
                    <CloudUpload className="h-10 w-10 text-gray-400 mb-2" />
                    <p className="text-sm font-medium">
                      Drag 'n' drop an Excel file here, or click to select file
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!file || isUploading}>
            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Upload and Import
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportDeductionDialog;