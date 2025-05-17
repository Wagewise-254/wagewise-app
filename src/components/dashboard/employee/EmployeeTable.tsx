// src/components/dashboard/employee/EmployeeTable.tsx

import React, { useState, useEffect, useMemo } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel, // For client-side pagination initially
  getFilteredRowModel, // For client-side filtering initially
} from '@tanstack/react-table';
import axios from 'axios'; // Import axios

// Import Shadcn UI table components
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
// Assuming search input is handled externally in EmployeePage
// import { Input } from '@/components/ui/input';
import { Loader2, Edit, Trash2 } from 'lucide-react'; // Icons
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  //AlertDialogTrigger, // Although not directly used for state control here, good to import
} from "@/components/ui/alert-dialog";

import { API_BASE_URL } from '@/config';
import useAuthStore from '@/store/authStore';

// Define the type for an Employee row in the table
// This should be a subset of your database columns that you want to display
export interface Employee {
  id: string; // UUID
  employee_number: string;
  first_name: string;
  last_name: string;
  email?: string | null; // Allow null
  phone: string;
  job_title?: string | null; // Allow null
  department?: string | null; // Allow null
  employee_status: string;
  // Include other relevant fields you want to display
}

interface EmployeeTableProps {
  searchTerm: string; // Search term passed from EmployeePage
  onDataChange: () => void; // Callback when data is added/imported/deleted/edited (to refetch)
  // We might add props for pagination state/callbacks later for server-side
}

const EmployeeTable: React.FC<EmployeeTableProps> = ({ searchTerm, onDataChange }) => {
  const { accessToken } = useAuthStore();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingEmployeeId, setDeletingEmployeeId] = useState<string | null>(null); // State for confirmation dialog

  // --- Data Fetching ---
  const fetchEmployees = React.useCallback(async () => {
    if (!accessToken) {
      setError("Authentication token missing.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // TODO: Implement server-side pagination and filtering here later
      // For now, fetching all data and doing client-side pagination/filtering
      const response = await axios.get(`${API_BASE_URL}/employees`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
         // TODO: Add pagination and search params here later
         // params: {
         //   page: pageIndex + 1, // TanStack Table uses 0-indexed pages
         //   pageSize: pageSize,
         //   searchTerm: searchTerm,
         // }
      });

      if (response.data && Array.isArray(response.data.employees)) {
        setEmployees(response.data.employees);
      } else {
          setEmployees([]); // Set empty array if response format is unexpected
           console.warn("Unexpected response format for employees fetch:", response.data);
      }


    } catch (err: unknown) {
      console.error("Error fetching employees:", err);
       if (axios.isAxiosError(err) && err.response && typeof err.response.data === 'object') {
             const backendError = err.response.data as { error?: string; message?: string };
             setError(backendError.error || backendError.message || 'Failed to fetch employees.');
       } else {
            setError('An unexpected error occurred while fetching employees.');
       }
       setEmployees([]); // Clear data on error
    } finally {
      setLoading(false);
    }
  }, [accessToken]);


  // Use onDataChange in the dependency array to refetch when parent signals data change
  useEffect(() => {
    fetchEmployees();
  }, [accessToken, onDataChange, fetchEmployees]);
 
  // --- Define Table Columns ---
  // Memoize columns to prevent unnecessary re-renders
  const columns = useMemo<ColumnDef<Employee>[]>(
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
        accessorKey: 'phone',
        header: 'Phone',
        cell: (info) => info.getValue(),
      },
       {
        accessorKey: 'email',
        header: 'Email',
        cell: (info) => info.getValue() || '-', // Display '-' if email is null
      },
       {
        accessorKey: 'job_title',
        header: 'Job Title',
        cell: (info) => info.getValue() || '-', // Display '-' if null
      },
       {
        accessorKey: 'employee_status',
        header: 'Status',
        cell: (info) => {
            const status = info.getValue() as string;
            // Basic formatting for status (e.g., capitalize)
            if (!status) return '-';
            return status.charAt(0).toUpperCase() + status.slice(1);
        },
      },
      // Add more columns for other fields you want to display here

      {
        id: 'actions', // Unique ID for the actions column
        header: 'Actions',
        cell: ({ row }) => {
          const employee = row.original; // Get the original employee data for this row

          // --- Handle Edit and Delete Actions ---
          const handleEdit = () => {
            console.log("Edit employee:", employee.id);
            // TODO: Implement Edit Dialog logic here
            // You'll likely need to open an EditEmployeeDialog and pass the employee data
          };

          const handleDeleteClick = () => {
            console.log("Attempting to delete employee:", employee.id);
            setDeletingEmployeeId(employee.id); // Set the ID to show confirmation dialog
          };

          return (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleEdit} disabled={loading}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDeleteClick} disabled={loading}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [loading] // Memoize columns, re-create if loading state changes (to disable buttons)
  );

  // --- TanStack Table Instance ---
  const table = useReactTable({
    data: employees, // Use the fetched data
    columns,
    getCoreRowModel: getCoreRowModel(),
    // --- Client-Side Pagination (Initial) ---
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
        pagination: {
            pageIndex: 0, // Start on the first page
            pageSize: 10, // Show 10 rows per page
        },
    },
    // --- Client-Side Filtering (Initial) ---
    getFilteredRowModel: getFilteredRowModel(), // Enables filtering
    globalFilterFn: 'includesString', // Default filter function (case-insensitive substring match)
    state: {
         globalFilter: searchTerm, // Apply the search term from the parent
    },
     // TODO: Add server-side pagination control here later
     // manualPagination: true,
     // pageCount: serverPageCount, // Total number of pages from server
     // onPaginationChange: setServerPagination, // Callback to update server state
  });

  // --- Handle Employee Deletion ---
  const handleDeleteConfirm = async () => {
    if (!deletingEmployeeId || !accessToken) return;

    console.log("Confirmed deletion for employee:", deletingEmployeeId);

    try {
        const response = await axios.delete(`${API_BASE_URL}/employees/${deletingEmployeeId}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (response.data?.message) {
            toast.success(response.data.message);
            onDataChange(); // Trigger refetch after deletion
        } else {
            toast.success("Employee deleted successfully."); // Generic success if no message
            onDataChange(); // Trigger refetch after deletion
        }

    } catch (err: unknown) {
        console.error("Error deleting employee:", err);
        if (axios.isAxiosError(err) && err.response && typeof err.response.data === 'object') {
             const backendError = err.response.data as { error?: string; message?: string };
             toast.error(backendError.error || backendError.message || 'Failed to delete employee.');
       } else {
            toast.error('An unexpected error occurred while deleting employee.');
       }
    } finally {
        setDeletingEmployeeId(null); // Close confirmation dialog
    }
  };


  return (
    <div className="w-full">
        {/* Loading State */}
        {loading && (
            <div className="flex justify-center items-center py-8">
                <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
                <span className="ml-2 text-gray-600">Loading Employees...</span>
            </div>
        )}

        {/* Error State */}
        {!loading && error && (
             <div className="text-center text-red-500 py-8">
                 {error}
                 {/* Optionally add a retry button */}
                 <Button variant="outline" className="ml-4" onClick={fetchEmployees}>Retry</Button>
             </div>
        )}

        {/* No Data State */}
        {!loading && !error && employees.length === 0 && (
            <div className="text-center text-gray-500 py-8">
                No employee data found. Use the "Add Employee" or "Import Employees" button to get started.
            </div>
        )}

        {/* Table Render */}
        {!loading && !error && employees.length > 0 && (
             <div className="px-3 rounded-md border overflow-auto bg-white"> {/* Add overflow-auto here */}
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
                    {table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow
                          key={row.id}
                          data-state={row.getIsSelected() && "selected"}
                        >
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

        {/* Pagination Controls (Client-Side Initial) */}
        {!loading && !error && employees.length > 0 && table.getPageCount() > 1 && ( // Only show if more than 1 page
             <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  Next
                </Button>
                 {/* Optional: Show page number and total pages */}
                 <span className="flex items-center gap-1">
                    <div>Page</div>
                    <strong>
                      {table.getState().pagination.pageIndex + 1} of{' '}
                      {table.getPageCount()}
                    </strong>
                  </span>
             </div>
        )}

        {/* AlertDialog for Deletion Confirmation */}
        {/* Use AlertDialog and its subcomponents */}
        <AlertDialog open={!!deletingEmployeeId} onOpenChange={(open) => !open && setDeletingEmployeeId(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete this employee? This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDeletingEmployeeId(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteConfirm}>Continue</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>


    </div>
  );
};

export default EmployeeTable;
