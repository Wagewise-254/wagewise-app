// src/components/company/hr/employee/ImportEmployeeDialog.tsx
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

interface ImportEmployeeDialogProps {
  isOpen: boolean;
  fetchEmployees: () => void;
  onClose: () => void;
}

const ImportEmployeeDialog: React.FC<ImportEmployeeDialogProps> = ({
  isOpen,
  onClose,
  fetchEmployees
}) => {
  const { companyId } = useParams();
 const session = useAuthStore.getState().session;
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setloading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "text/csv": [".csv"],
    },
  });

  const handleDownloadTemplate = async () => {
    setloading(true)
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

      const response = await axios.get(
        `${API_BASE_URL}/company/${companyId}/employees/template`,
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
      link.setAttribute("download", "Employee_Import_Template.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Template downloaded successfully.");
    } catch (error) {
      console.error("Error downloading template:", error);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(
          error.response.data.error || "Failed to download template."
        );
      } else {
        toast.error("Failed to download template.");
      }
    } finally {
      setloading(false)
    }
  };

  const handleUpload = async () => {
    if (!file || !companyId) {
      toast.error("Please select a file to upload.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = session?.access_token;
      const response = await axios.post(
        `${API_BASE_URL}/company/${companyId}/employees/import`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success(response.data.message);
      fetchEmployees(); 
      setFile(null);
      onClose();
    } catch (error) {
      console.error("Upload error:", error);
      if (axios.isAxiosError(error) && error.response) {
        const errorMessage =
          error.response.data.error || "Failed to import employees.";
        toast.error(errorMessage);
        if (error.response.data.details) {
          error.response.data.details.forEach((detail: string) => {
            toast.error(detail);
          });
        }
      } else {
        toast.error("An unexpected error occurred.");
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Import Employees</DialogTitle>
          <DialogDescription>
            Streamline your employee data management by importing from an Excel
            or CSV file.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col space-y-2">
            <h4 className="font-semibold text-sm">Step 1: Download Template</h4>
            <p className="text-muted-foreground text-xs">
              Use this template to ensure correct column headers and data
              format.
            </p>
            <Button
              variant="outline"
              onClick={handleDownloadTemplate}
              className="w-full cursor-pointer"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Download className="mr-2 h-4 w-4" /> Download Employee Excel
              Template
            </Button>
          </div>

          <div className="flex flex-col space-y-2">
            <h4 className="font-semibold text-sm">Step 2: Upload Your File</h4>
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
                      Drag 'n' drop an Excel or CSV file here, or click to
                      select file
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
            Upload and Add
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportEmployeeDialog;
