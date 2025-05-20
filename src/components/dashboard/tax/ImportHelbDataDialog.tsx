// src/components/dashboard/tax/ImportHelbDataDialog.tsx

import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import axios from 'axios';
import { toast } from 'sonner';
import { Loader2, Upload } from 'lucide-react';

// Import Shadcn UI components
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { API_BASE_URL } from '@/config';
import useAuthStore from '@/store/authStore';

interface ImportHelbDataDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onImportSuccess: () => void; // Callback to refetch data in parent
}

interface ImportFormInputs {
    helbFile: FileList;
}

const ImportHelbDataDialog: React.FC<ImportHelbDataDialogProps> = ({ isOpen, onClose, onImportSuccess }) => {
    const { accessToken } = useAuthStore();
    const { register, handleSubmit, reset, formState: { errors } } = useForm<ImportFormInputs>();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fileError, setFileError] = useState<string | null>(null);

    // Reset form and state when dialog opens/closes
    React.useEffect(() => {
        if (isOpen) {
            reset();
            setFileError(null);
            setIsSubmitting(false);
        }
    }, [isOpen, reset]);

    const onSubmit: SubmitHandler<ImportFormInputs> = async (data) => {
        if (!accessToken) {
            toast.error("Authentication token missing. Please log in again.");
            return;
        }

        const file = data.helbFile[0];
        if (!file) {
            setFileError("Please select an Excel file to import.");
            return;
        }

        // Basic file type validation
        const allowedTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel', // .xls
        ];
        if (!allowedTypes.includes(file.type)) {
            setFileError("Only Excel files (.xlsx, .xls) are allowed.");
            return;
        }

        setIsSubmitting(true);
        setFileError(null);

        const formData = new FormData();
        formData.append('helbFile', file); // 'helbFile' must match the backend's expected field name

        try {
            // TODO: Create this backend endpoint
            const response = await axios.post(`${API_BASE_URL}/tax/helb/import`, formData, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'multipart/form-data', // Important for file uploads
                },
            });

            toast.success(response.data.message || "HELB deduction data imported successfully!");
            onImportSuccess(); // Trigger refetch in parent
            onClose(); // Close the dialog

        } catch (err: unknown) {
            console.error("Error importing HELB data:", err);
            if (axios.isAxiosError(err) && err.response && typeof err.response.data === 'object') {
                interface ErrorResponse {
                    error?: string;
                    message?: string;
                    details?: Record<string, unknown>;
                }
                const backendError = err.response.data as ErrorResponse;
                const errorMessage = backendError.error || backendError.message || 'Failed to import HELB data.';
                setFileError(errorMessage);
                toast.error(errorMessage);
            } else {
                setFileError('An unexpected error occurred during HELB import.');
                toast.error('An unexpected error occurred during HELB import.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Import HELB Deductions</DialogTitle>
                    <DialogDescription>
                        Upload an Excel file containing HELB deduction amounts for employees.
                        The file should contain 'Employee Number', 'ID Number', 'HELB Account No', and 'Monthly Deduction' columns.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="helbFile">HELB Excel File</Label>
                        <Input
                            id="helbFile"
                            type="file"
                            accept=".xlsx, .xls"
                            {...register('helbFile', { required: 'HELB Excel file is required.' })}
                        />
                        {errors.helbFile && <p className="text-red-500 text-sm">{errors.helbFile.message}</p>}
                        {fileError && <p className="text-red-500 text-sm">{fileError}</p>}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                            {isSubmitting ? 'Importing...' : 'Import Data'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default ImportHelbDataDialog;
