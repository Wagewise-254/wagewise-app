// src/components/dashboard/tax/HelbManagementSection.tsx

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Loader2, FileDown, FileUp } from 'lucide-react'; // Icons for export/import

// Import Shadcn UI components
import { Button } from '@/components/ui/button';
// The Input import is here but commented out in usage - keeping it in imports is fine if you plan to use it
//import { Input } from '@/components/ui/input'; // If needed for filtering within HELB section
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'; // For the HELB employees table

import { API_BASE_URL } from '@/config';
import useAuthStore from '@/store/authStore';

// Reuse the Employee type, ensuring it includes the HELB fields
// Make sure this path and the Employee type definition are correct
import { Employee } from '@/components/dashboard/employee/EmployeeTable';
import ImportHelbDataDialog from './ImportHelbDataDialog'; // Import the dialog component

// Define a type for the data fetched specifically for the HELB table
// This might include joined data from employee_helb_details
interface HelbEmployee extends Employee {
    helb_account_no?: string | null;
    monthly_deduction?: number | null;
    helb_status?: string | null; // Status from employee_helb_details
    effective_date?: string | null; // Effective date from employee_helb_details
    end_date?: string | null; // End date from employee_helb_details
    imported_at?: string | null; // Import timestamp from employee_helb_details
}


const HelbManagementSection: React.FC = () => {
    const { accessToken } = useAuthStore();

    const [helbEmployees, setHelbEmployees] = useState<HelbEmployee[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // State for the import dialog (will create later)
    const [isImportHelbDialogOpen, setIsImportHelbDialogOpen] = useState(false);


    // --- Data Fetching ---
    // Fetch employees who are marked as is_helb_paying
    const fetchHelbEmployees = async () => {
        if (!accessToken) {
            setError("Authentication token missing.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // TODO: Create this backend endpoint
            // This endpoint should fetch employees where is_helb_paying is true
            // and potentially join with employee_helb_details to get deduction info
            const response = await axios.get(`${API_BASE_URL}/tax/helb/paying-employees`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (response.data && Array.isArray(response.data.employees)) {
                   // Map the fetched data to the HelbEmployee interface
                    const formattedData: HelbEmployee[] = response.data.employees.map((emp: HelbEmployee) => ({
                        ...emp,
                        // Ensure numeric fields are numbers, even if null from backend
                        monthly_deduction: emp.monthly_deduction ?? null,
                        // Ensure boolean fields are boolean, even if null from backend
                        is_helb_paying: emp.is_helb_paying ?? false,
                        // Dates might need formatting if you display them
                    }));
                setHelbEmployees(formattedData);
            } else {
                setHelbEmployees([]);
                console.warn("Unexpected response format for HELB employees fetch:", response.data);
                // Optionally set an error here if the format is critical
                // setError("Received unexpected data format from the server.");
            }

        } catch (err: unknown) {
            console.error("Error fetching HELB employees:", err);
            if (axios.isAxiosError(err) && err.response && typeof err.response.data === 'object') {
                const backendError = err.response.data as { error?: string; message?: string };
                setError(backendError.error || backendError.message || 'Failed to fetch HELB employees.');
            } else {
                setError('An unexpected error occurred while fetching HELB employees.');
            }
            setHelbEmployees([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch HELB employees when the component mounts or token changes
    useEffect(() => {
        fetchHelbEmployees();
    }, [accessToken]); // Add other dependencies if needed for refetching

    // --- Define Table Columns for HELB Employees ---
    const columns = useMemo<ColumnDef<HelbEmployee>[]>(
        () => [
            {
                accessorKey: 'employee_number',
                header: 'Employee No',
                cell: (info) => info.getValue(),
            },
            {
                accessorKey: 'first_name',
                header: 'First Name',
                cell: (info) => info.getValue(),
            },
            {
                accessorKey: 'last_name',
                header: 'Last Name',
                cell: (info) => info.getValue(),
            },
            {
                accessorKey: 'id_number',
                header: 'ID Number',
                cell: (info) => info.getValue(),
            },
             {
                accessorKey: 'kra_pin',
                header: 'KRA PIN',
                cell: (info) => info.getValue(),
            },
             {
                accessorKey: 'helb_account_no',
                header: 'HELB Account No',
                cell: (info) => info.getValue() || '-',
            },
            {
                accessorKey: 'monthly_deduction',
                header: 'Monthly Deduction',
                cell: (info) => {
                    const amount = info.getValue() as number | null;
                    return amount !== null ? `KSh ${amount.toFixed(2)}` : '-';
                },
            },
            {
                 accessorKey: 'effective_date',
                 header: 'Effective Date',
                 cell: (info) => {
                    const dateValue = info.getValue() as string | null;
                    // Basic date formatting example (adjust as needed)
                    return dateValue ? new Date(dateValue).toLocaleDateString() : '-';
                 },
            },
             {
                 accessorKey: 'helb_status',
                 header: 'Status',
                 cell: (info) => info.getValue() || '-', // Display status or '-'
            },
            // Add more columns as needed
        ],
        [] // No dependencies for columns unless they rely on state/props
    );

    // --- TanStack Table Instance for HELB Employees ---
    const table = useReactTable({
        data: helbEmployees, // Use the fetched HELB employees data
        columns,
        getCoreRowModel: getCoreRowModel(),
        // Add pagination, sorting, filtering if needed for this table
        // getPaginationRowModel: getPaginationRowModel(),
        // getFilteredRowModel: getFilteredRowModel(),
        // getSortedRowModel: getSortedRowModel(),
    });


    // --- Handle Export HELB Data ---
    const handleExportHelb = async () => {
        if (!accessToken) {
            toast.error("Authentication token missing. Cannot export.");
            return;
        }

        try {
            // TODO: Create this backend endpoint
            const response = await axios.get(`${API_BASE_URL}/tax/helb/export`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                responseType: 'blob', // Important for downloading files
            });

            // Create a download link and trigger the download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'helb_employees_export.xlsx'); // Suggested filename
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url); // Clean up the object URL

            toast.success("HELB employee data exported successfully!");

        } catch (err: unknown) {
            console.error("Error exporting HELB employees:", err);
            let errorMessage = 'An unexpected error occurred while exporting HELB employees.';

            if (axios.isAxiosError(err)) {
                 if (err.response) {
                    // Try to read the error message from the response body, even if it's a Blob
                    if (err.response.data instanceof Blob) {
                        const reader = new FileReader();
                        reader.onload = function() {
                            try {
                                const errorText = reader.result as string;
                                const backendError = JSON.parse(errorText) as { error?: string; message?: string };
                                errorMessage = backendError.error || backendError.message || 'Failed to export HELB employees. Could not read error response.';
                                toast.error(errorMessage);
                            } catch {
                                toast.error('Failed to export HELB employees. Could not parse error response.');
                            }
                        };
                         reader.onerror = function () {
                             toast.error('Failed to export HELB employees. Error reading error response.');
                         };
                        reader.readAsText(err.response.data);
                         // Prevent the generic toast below from showing immediately
                         return;
                    } else if (typeof err.response.data === 'object') {
                        const backendError = err.response.data as { error?: string; message?: string };
                        errorMessage = backendError.error || backendError.message || errorMessage;
                    } else if (typeof err.response.data === 'string') {
                         errorMessage = err.response.data;
                    }
                 } else {
                     errorMessage = 'Network error or no response from server.';
                 }
            }

            toast.error(errorMessage);
        }
    };

     // --- Handle Import HELB Data ---
     const handleImportHelb = () => {
         // Open the import dialog
         setIsImportHelbDialogOpen(true);
     };

     // Callback after successful import (from the import dialog)
     const handleHelbImportSuccess = () => {
         toast.success("HELB deduction data imported successfully!");
         fetchHelbEmployees(); // Refetch the table data to show updated deductions
     };


    return (
        <div className="p-6">
            <h2 className="text-2xl font-semibold mb-4">HELB Management</h2>
            <p className="text-gray-600 mb-6">Manage employees who are paying HELB and import their deduction amounts.</p>

            {/* Action Buttons: Export and Import */}
            <div className="flex gap-4 mb-6">
                 <Button onClick={handleExportHelb} disabled={loading || helbEmployees.length === 0}>
                     <FileDown className="mr-2 h-4 w-4" />
                     Export HELB Data
                 </Button>
                 <Button variant="outline" onClick={handleImportHelb} disabled={loading}>
                      <FileUp className="mr-2 h-4 w-4" />
                      Import HELB Data
                 </Button>
            </div>


            {/* Loading State */}
            {loading && (
                <div className="flex justify-center items-center py-8">
                    <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
                    <span className="ml-2 text-gray-600">Loading HELB Employees...</span>
                </div>
            )}

            {/* Error State */}
            {!loading && error && (
                 <div className="text-center text-red-500 py-8">
                      {error}
                      {/* Optionally add a retry button */}
                      <Button variant="outline" className="ml-4" onClick={fetchHelbEmployees}>Retry</Button>
                 </div>
            )}

            {/* No Data State */}
            {!loading && !error && helbEmployees.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                    No employees marked as paying HELB. Mark employees as "Paying HELB" in the Employee Management section to see them here.
                </div>
            )}

            {/* Table Render for HELB Employees */}
            {!loading && !error && helbEmployees.length > 0 && (
                 <div className="rounded-md border overflow-auto">
                     <Table>
                         <TableHeader>
                             {table.getHeaderGroups().map((headerGroup) => (
                                 <TableRow key={headerGroup.id}>
                                     {headerGroup.headers.map((header) => {
                                         return (
                                             <TableHead key={header.id}>
                                                 {header.isPlaceholder
                                                     ? null
                                                     : flexRender(
                                                           header.column.columnDef.header,
                                                           header.getContext()
                                                       )}
                                             </TableHead>
                                         );
                                     })}
                                 </TableRow>
                             ))}
                         </TableHeader>
                         <TableBody>
                             {/* Corrected rendering logic */}
                             {table.getRowModel().rows?.length ? (
                                 table.getRowModel().rows.map((row) => (
                                     <TableRow
                                         key={row.id}
                                         data-state={row.getIsSelected() && "selected"}
                                     >
                                         {/* This maps the cells *within* the TableRow */}
                                         {row.getVisibleCells().map((cell) => (
                                             <TableCell key={cell.id}>
                                                 {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                             </TableCell>
                                         ))}
                                     </TableRow>
                                 ))
                             ) : (
                                 <TableRow>
                                     <TableCell colSpan={columns.length} className="h-24 text-center">
                                         No results.
                                     </TableCell>
                                 </TableRow>
                             )}
                         </TableBody>
                     </Table>
                  </div>
            )}

            {/* TODO: Implement the HELB Import Dialog */}
            {/* You would render the dialog component here, conditionally based on isImportHelbDialogOpen */}
             <ImportHelbDataDialog
                 isOpen={isImportHelbDialogOpen}
                 onClose={() => setIsImportHelbDialogOpen(false)}
                 onImportSuccess={handleHelbImportSuccess}
             />
             

        </div >
    );
};

export default HelbManagementSection;