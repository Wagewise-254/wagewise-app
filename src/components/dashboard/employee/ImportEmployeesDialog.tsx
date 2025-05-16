// src/components/dashboard/employee/ImportEmployeesDialog.tsx - Import Dialog

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone'; // For drag and drop
import axios from 'axios';
import { toast } from 'sonner';
import { Loader2, UploadCloud, FileText } from 'lucide-react'; // Icons
//import Link from 'next/link'; // Assuming you are using Next.js Link, adjust if using react-router-dom Link

// Import Shadcn UI components
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress'; // Assuming you have Progress component
import { Label } from '@/components/ui/label';

import { API_BASE_URL } from '@/config'; // Adjust path as needed
import useAuthStore from '@/store/authStore'; // Import auth store to get access token

interface ImportEmployeesDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onImportSuccess?: () => void; // Optional callback after successful import
}

const ImportEmployeesDialog: React.FC<ImportEmployeesDialogProps> = ({ isOpen, onClose, onImportSuccess }) => {
    const { accessToken } = useAuthStore();

    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [importError, setImportError] = useState<string | null>(null);

    // --- Dropzone Setup ---
    const onDrop = useCallback((acceptedFiles: File[]) => {
        // Process the accepted files (usually just one for an Excel import)
        if (acceptedFiles.length > 0) {
            const uploadedFile = acceptedFiles[0];
             // Basic file type check (can be more robust)
            const allowedTypes = [
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
                'application/vnd.ms-excel', // .xls
            ];
            if (allowedTypes.includes(uploadedFile.type)) {
                 setFile(uploadedFile);
                 setImportError(null); // Clear previous errors
            } else {
                 setFile(null);
                 setImportError("Invalid file type. Please upload an Excel file (.xlsx, .xls).");
                 toast.error("Invalid file type. Only Excel files are allowed.");
            }
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: false }); // Only accept one file
    // --- End Dropzone Setup ---


    // --- Handle File Upload to Backend ---
    const handleUpload = async () => {
        if (!file) {
            setImportError("Please select an Excel file to upload.");
            toast.error("No file selected.");
            return;
        }

        if (!accessToken) {
             setImportError("Authentication token is missing. Please log in again.");
             toast.error("Authentication token missing.");
             // Consider redirecting to login here
             return;
        }

        setIsUploading(true);
        setUploadProgress(0);
        setImportError(null);

        const formData = new FormData();
        formData.append('excelFile', file); // 'excelFile' must match the field name in multer config on backend

        try {
            const response = await axios.post(`${API_BASE_URL}/employees/import`, formData, {
                headers: {
                    Authorization: `Bearer ${accessToken}`, // Include the access token
                    'Content-Type': 'multipart/form-data', // Important for file uploads
                },
                onUploadProgress: (progressEvent) => {
                    // Calculate and update upload progress
                    if (progressEvent.total) {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(percentCompleted);
                    }
                },
            });

            console.log("Import successful:", response.data);
            toast.success(response.data.message || "Employee data imported successfully!");

            // Optional: Call parent callback on success
            onImportSuccess?.();

            // Close the dialog on success
            handleCloseDialog();

        } catch (err: unknown) {
            console.error("Import error:", err);
            setIsUploading(false); // Stop loading

            if (axios.isAxiosError(err) && err.response && typeof err.response.data === 'object') {
                 interface ErrorResponse {
                    error?: string;
                    message?: string;
                    details?: Record<string, unknown>; // To capture backend validation details
                }
                const backendError = err.response.data as ErrorResponse;
                const backendErrorMessage = backendError.error || backendError.message || "Failed to import employee data.";

                setImportError(backendErrorMessage);
                toast.error(backendErrorMessage);

                // Log detailed errors from backend if available
                if (backendError.details) {
                    console.error("Import Details:", backendError.details);
                    // You might want to display these details to the user in the UI
                }

            } else {
                const genericErrorMessage = "An unexpected error occurred during import.";
                setImportError(genericErrorMessage);
                toast.error(genericErrorMessage);
            }
        }
    };
    // --- End Handle File Upload ---

    // --- Handle Template Download ---
    const handleDownloadTemplate = () => {
        // Assuming your template is in the public/assets folder or served statically
        // You might need a backend route to serve the asset if it's not public
        //const templatePath = '/assets/employee_import_template.xlsx'; // Adjust path if necessary
        const templatePath = './src/assets/employee_import_template.xlsx'; // Adjust path if necessary
        // Using a simple anchor tag for download
        const link = document.createElement('a');
        link.href = templatePath;
        link.download = 'employee_import_template.xlsx'; // Suggested filename
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        //add timer of 3 seconds before showing the toast
        setTimeout(() => {
           toast.success("Template downloaded successfully!");
        }, 3500); // Dismiss the toast after 3 seconds


    };
    // --- End Handle Template Download ---

    // --- Reset state when dialog closes ---
    const handleCloseDialog = () => {
        setFile(null);
        setIsUploading(false);
        setUploadProgress(0);
        setImportError(null);
        onClose(); // Call the parent's onClose
    };

    return (
        // Use Shadcn UI Dialog component
        <Dialog open={isOpen} onOpenChange={handleCloseDialog}> {/* Use handleCloseDialog here */}
            <DialogContent className="sm:max-w-[425px] md:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Import Employees from Excel</DialogTitle>
                    <DialogDescription>
                        Download the template, fill it with employee data, and upload the file.
                    </DialogDescription>
                </DialogHeader>

                {/* Template Download Link/Button */}
                <div className="mb-4">
                    <Label>Download Template:</Label>
                    {/* Using a simple button for download */}
                    <Button variant="outline" className="mt-2 w-full" onClick={handleDownloadTemplate}>
                        <FileText className="mr-2 h-4 w-4" />
                        Download Excel Template
                    </Button>
                     {/* If using Next.js Link for internal assets */}
                     {/* <Link href="/assets/employee_import_template.xlsx" download>
                         <Button variant="outline" className="mt-2 w-full">
                            <FileText className="mr-2 h-4 w-4" />
                            Download Excel Template
                         </Button>
                     </Link> */}
                </div>


                {/* File Dropzone Area */}
                <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors ${
                        isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                >
                    <input {...getInputProps()} />
                    <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                    {isDragActive ? (
                        <p className="mt-2 text-gray-600">Drop the file here ...</p>
                    ) : (
                        <p className="mt-2 text-gray-600">Drag 'n' drop an Excel file here, or click to select file</p>
                    )}
                     {file && (
                        <p className="mt-2 text-sm text-gray-800">Selected file: {file.name}</p>
                    )}
                </div>

                {/* Error Message */}
                {importError && (
                    <p className="text-red-500 text-sm mt-2 text-center">{importError}</p>
                )}

                {/* Upload Progress */}
                {isUploading && (
                    <div className="mt-4">
                        <Label>Uploading...</Label>
                        <Progress value={uploadProgress} className="w-full mt-2" />
                         <p className="text-center text-sm text-gray-600 mt-1">{uploadProgress}%</p>
                    </div>
                )}


                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={handleCloseDialog} disabled={isUploading}>
                        Cancel
                    </Button>
                    <Button onClick={handleUpload} disabled={!file || isUploading}>
                        {isUploading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                        Upload and Import
                    </Button>
                </DialogFooter>

            </DialogContent>
        </Dialog>
    );
};

export default ImportEmployeesDialog;
