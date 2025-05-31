// src/components/dashboard/employee/ExportEmployeesDialog.tsx - Updated

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, FileText } from 'lucide-react'; // Removed File icon as PDF export is gone

// Import Shadcn UI components
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

import { API_BASE_URL } from '@/config';
import useAuthStore from '@/store/authStore';

interface ExportEmployeesDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

const ExportEmployeesDialog: React.FC<ExportEmployeesDialogProps> = ({ isOpen, onClose }) => {
    const { accessToken } = useAuthStore();

    const [isExportingExcel, setIsExportingExcel] = useState(false);
    // Removed isExportingPdf state

    const [exportError, setExportError] = useState<string | null>(null);

    // --- Handle Export Logic ---
    const handleExport = async (format: 'excel') => { // Only 'excel' format is now accepted
        console.log(`--- Attempting to export to ${format}... ---`);
        setExportError(null); // Clear previous errors

        setIsExportingExcel(true); // Only Excel state remains

        if (!accessToken) {
            console.error("Authentication token missing for export.");
            toast.error("Authentication token missing. Cannot export.");
            setIsExportingExcel(false);
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
                const errorData = await response.json().catch(() => ({ error: 'Unknown export error' }));
                console.error("Export failed:", response.status, errorData);
                const errorMessage = errorData.error || `Export failed: HTTP ${response.status}`;
                setExportError(errorMessage);
                toast.error(errorMessage);
                return;
            }

            // Get the filename from the Content-Disposition header
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = `employees.xlsx`; // Default filename for Excel
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

            toast.success(`Employee data exported to Excel successfully!`);
            handleCloseDialog(); // Close dialog on success

        } catch (error) {
            console.error("Export error:", error);
            const genericErrorMessage = "An unexpected error occurred during export.";
            setExportError(genericErrorMessage);
            toast.error(genericErrorMessage);
        } finally {
            setIsExportingExcel(false);
            console.log(`--- Export attempt finished for ${format}. ---`);
        }
    };
    // --- End Handle Export ---

    // --- Reset state when dialog closes ---
    const handleCloseDialog = () => {
        setIsExportingExcel(false);
        setExportError(null);
        onClose(); // Call the parent's onClose
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Export Employee Data</DialogTitle>
                    <DialogDescription>
                        Export your employee data to an Excel file.
                    </DialogDescription>
                </DialogHeader>

                {/* Export Options */}
                <div className="grid gap-4 py-4">
                    {/* Excel Export Button */}
                    <Button
                        variant="outline"
                        onClick={() => handleExport('excel')}
                        disabled={isExportingExcel} // Only disable for Excel export
                    >
                        {isExportingExcel ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <FileText className="mr-2 h-4 w-4" />}
                        Export to Excel (.xlsx)
                    </Button>

                    {/* PDF Export Button (Removed) */}
                </div>

                {/* Error Message */}
                {exportError && (
                    <p className="text-red-500 text-sm mt-2 text-center">{exportError}</p>
                )}

                <DialogFooter>
                    <Button variant="ghost" onClick={handleCloseDialog} disabled={isExportingExcel}>
                        Cancel
                    </Button>
                </DialogFooter>

            </DialogContent>
        </Dialog>
    );
};

export default ExportEmployeesDialog;