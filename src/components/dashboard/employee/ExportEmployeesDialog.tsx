// src/components/dashboard/employee/ExportEmployeesDialog.tsx - Export Dialog

import React, { useState } from 'react';
//import axios from 'axios';
import { toast } from 'sonner';
import { Loader2, FileText, File } from 'lucide-react'; // Icons

// Import Shadcn UI components
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

import { API_BASE_URL } from '@/config'; // Adjust path as needed
import useAuthStore from '@/store/authStore'; // Import auth store to get access token


interface ExportEmployeesDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

const ExportEmployeesDialog: React.FC<ExportEmployeesDialogProps> = ({ isOpen, onClose }) => {
    const { accessToken } = useAuthStore(); // Get access token from store

    const [isExportingExcel, setIsExportingExcel] = useState(false);
    const [isExportingPdf, setIsExportingPdf] = useState(false);
    const [exportError, setExportError] = useState<string | null>(null);


    // --- Handle Export Logic (Moved from EmployeePage) ---
    const handleExport = async (format: 'excel' | 'pdf') => {
        console.log(`--- Attempting to export to ${format}... ---`);
        setExportError(null); // Clear previous errors

        if (format === 'excel') setIsExportingExcel(true);
        if (format === 'pdf') setIsExportingPdf(true);


        if (!accessToken) {
            console.error("Authentication token missing for export.");
            toast.error("Authentication token missing. Cannot export.");
            setIsExportingExcel(false);
            setIsExportingPdf(false);
            // Consider redirecting to login here
            return;
        }

        try {
            const exportUrl = `${API_BASE_URL}/employees/export/${format}`;

            const response = await fetch(exportUrl, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            if (!response.ok) {
                 // Attempt to read error message from response body if available
                const errorData = await response.json().catch(() => ({ error: 'Unknown export error' }));
                console.error("Export failed:", response.status, errorData);
                const errorMessage = errorData.error || `Export failed: HTTP ${response.status}`;
                setExportError(errorMessage);
                toast.error(errorMessage);
                return;
            }

            // Get the filename from the Content-Disposition header
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = `employees.${format === 'excel' ? 'xlsx' : 'pdf'}`; // Default filename
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="(.+)"/);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1];
                }
            }

            // Create a blob from the response and trigger download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename; // Set the download filename
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url); // Clean up
            a.remove();

            toast.success(`Employee data exported to ${format.toUpperCase()} successfully!`);
            handleCloseDialog(); // Close dialog on success

        } catch (error) {
            console.error("Export error:", error);
            const genericErrorMessage = "An unexpected error occurred during export.";
            setExportError(genericErrorMessage);
            toast.error(genericErrorMessage);
        } finally {
            setIsExportingExcel(false);
            setIsExportingPdf(false);
             console.log(`--- Export attempt finished for ${format}. ---`);
        }
    };
    // --- End Handle Export ---

    // --- Reset state when dialog closes ---
    const handleCloseDialog = () => {
        setIsExportingExcel(false);
        setIsExportingPdf(false);
        setExportError(null);
        onClose(); // Call the parent's onClose
    };


    return (
        // Use Shadcn UI Dialog component
        <Dialog open={isOpen} onOpenChange={handleCloseDialog}> {/* Use handleCloseDialog here */}
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Export Employee Data</DialogTitle>
                    <DialogDescription>
                        Choose the format you want to export your employee data in.
                    </DialogDescription>
                </DialogHeader>

                {/* Export Options */}
                <div className="grid gap-4 py-4">
                    {/* Excel Export Button */}
                    <Button
                        variant="outline"
                        onClick={() => handleExport('excel')}
                        disabled={isExportingExcel || isExportingPdf} // Disable while any export is in progress
                    >
                         {isExportingExcel ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <FileText className="mr-2 h-4 w-4" />}
                         Export to Excel (.xlsx)
                    </Button>

                    {/* PDF Export Button (Disabled as backend is not implemented) */}
                    <Button
                        variant="outline"
                        onClick={() => handleExport('pdf')}
                        disabled={true} // Always disabled until backend is ready
                    >
                         {isExportingPdf ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <File className="mr-2 h-4 w-4" />}
                         Export to PDF (.pdf) (Coming Soon)
                    </Button>
                </div>

                 {/* Error Message */}
                {exportError && (
                    <p className="text-red-500 text-sm mt-2 text-center">{exportError}</p>
                )}


                <DialogFooter>
                    <Button variant="ghost" onClick={handleCloseDialog} disabled={isExportingExcel || isExportingPdf}>
                        Cancel
                    </Button>
                </DialogFooter>

            </DialogContent>
        </Dialog>
    );
};

export default ExportEmployeesDialog;
