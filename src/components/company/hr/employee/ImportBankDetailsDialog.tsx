// src/components/company/hr/employee/ImportBankDetailsDialog.tsx
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
//import { useHrStore } from "@/stores/hrStore";
import { useParams } from "react-router-dom";
import axios from "axios";

interface ImportBankDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ImportBankDetailsDialog: React.FC<ImportBankDetailsDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
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
      "text/csv": [".csv"],
    },
    multiple: false,
  });

  const handleDownloadTemplate = async () => {
    try {
      const response = await axios({
        url: `${API_BASE_URL}/company/${companyId}/employees/bank-details/template`,
        method: "GET",
        responseType: "blob", // Important for handling binary data
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "employee_bank_details_template.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Bank details template downloaded successfully!");
    } catch (error) {
      toast.error("Failed to download template.");
      console.error("Download template error:", error);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/company/${companyId}/employees/bank-details/import`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${session?.access_token}`,
          },
        }
      );

      toast.success(response.data.message || "Bank details imported successfully!");
      onSuccess(); // Close dialog and refresh data
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        toast.error(error.response.data.error);
        if (error.response.data.details) {
            error.response.data.details.forEach((detail: string) => {
                toast.error(detail);
            });
        }
      } else {
        toast.error("Failed to import bank details.");
      }
      console.error("Import error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Import Bank Details</DialogTitle>
          <DialogDescription>
            Download the template, fill it with your employee's bank details,
            and upload it to update them in bulk.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handleDownloadTemplate}
              className="w-full justify-center"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </Button>
          </div>
          <div>
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

export default ImportBankDetailsDialog;