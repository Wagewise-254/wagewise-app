// src/components/dashboard/account/DataManagement.tsx - Populated

import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { API_BASE_URL } from '@/config';
import useAuthStore from '@/store/authStore';

const DataManagement: React.FC = () => {
  const { accessToken, logout } = useAuthStore();
  const [isExporting, setIsExporting] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- Handle Data Export ---
  const handleExportData = async () => {
    if (!accessToken) {
      toast.error("Authentication required to export data.");
      return;
    }

    setIsExporting(true);
    try {
      // Assuming a backend endpoint that generates and returns a file
      const response = await axios.get(`${API_BASE_URL}/data/export-all`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        responseType: 'blob', // Important for downloading files
      });

      // Create a blob from the response data
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      // Create a link element
      const link = document.createElement('a');
      // Set the download attribute and href
      link.href = window.URL.createObjectURL(blob);
      link.download = 'company_data_export.xlsx'; // Or dynamic filename from headers if available
      // Append to the document body
      document.body.appendChild(link);
      // Programmatically click the link to trigger the download
      link.click();
      // Clean up by removing the link and revoking the object URL
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);

      toast.success("All company data exported successfully!");

    } catch (err: unknown) {
      console.error("Error exporting data:", err);
      if (axios.isAxiosError(err) && err.response && typeof err.response.data === 'object') {
        const backendError = err.response.data as { error?: string; message?: string };
        toast.error(backendError.error || backendError.message || 'Failed to export data.');
      } else {
        toast.error('An unexpected error occurred while exporting data.');
      }
    } finally {
      setIsExporting(false);
    }
  };

  // --- Handle Account Deactivation (Soft Disable) ---
  const handleDeactivateAccount = async () => {
    if (!accessToken) {
      toast.error("Authentication required to deactivate account.");
      return;
    }

    setIsDeactivating(true);
    try {
      const response = await axios.put(`${API_BASE_URL}/company/status`, {
        status: 'disabled', // Set company status to 'disabled'
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      toast.success(response.data.message || "Company account deactivated successfully!");
      // Log out the user after deactivation
      logout();

    } catch (err: unknown) {
      console.error("Error deactivating account:", err);
      if (axios.isAxiosError(err) && err.response && typeof err.response.data === 'object') {
        const backendError = err.response.data as { error?: string; message?: string };
        toast.error(backendError.error || backendError.message || 'Failed to deactivate account.');
      } else {
        toast.error('An unexpected error occurred while deactivating account.');
      }
    } finally {
      setIsDeactivating(false);
    }
  };

  // --- Handle Account Deletion (Soft Delete/Trash) ---
  const handleDeleteAccount = async () => {
    if (!accessToken) {
      toast.error("Authentication required to delete account.");
      return;
    }

    setIsDeleting(true);
    try {
      const response = await axios.put(`${API_BASE_URL}/company/status`, {
        status: 'trashed', // Set company status to 'trashed'
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      toast.success(response.data.message || "Company account moved to trash. It can be recovered if needed.");
      // Log out the user after deletion
      logout();

    } catch (err: unknown) {
      console.error("Error deleting account:", err);
      if (axios.isAxiosError(err) && err.response && typeof err.response.data === 'object') {
        const backendError = err.response.data as { error?: string; message?: string };
        toast.error(backendError.error || backendError.message || 'Failed to move account to trash.');
      } else {
        toast.error('An unexpected error occurred while moving account to trash.');
      }
    } finally {
      setIsDeleting(false);
    }
  };


  return (
    <Card className="p-6">
      <CardHeader>
        <CardTitle>Data Management</CardTitle>
        <p className="text-gray-600">Export your company data or manage account status.</p>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Export Data Section */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Export All Company Data</h3>
          <p className="text-gray-500 mb-3">Download all your company's data, including employee records and payroll history, for backup or external use.</p>
          <Button onClick={handleExportData} disabled={isExporting} variant="outline">
            {isExporting ? <Loader2 className="animate-spin mr-2" size={20} /> : null}
            {isExporting ? 'Exporting...' : 'Export All Data (Excel)'}
          </Button>
          <p className="text-sm text-gray-400 mt-2">Note: This may take some time for large datasets.</p>
        </div>

        {/* Account Deactivation / Deletion Section */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Account Status</h3>
          <p className="text-gray-500 mb-3">
            Manage your company's active status. Deactivating will temporarily disable access, while moving to trash marks it for potential later recovery.
          </p>

          <div className="flex gap-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isDeactivating}>
                  {isDeactivating ? <Loader2 className="animate-spin mr-2" size={20} /> : null}
                  {isDeactivating ? 'Deactivating...' : 'Deactivate Account'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action will **deactivate your company account**. You will be logged out and your team will lose access to the system. You can contact support to reactivate your account.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeactivateAccount} disabled={isDeactivating}>
                    {isDeactivating ? 'Deactivating...' : 'Confirm Deactivation'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isDeleting}>
                  {isDeleting ? <Loader2 className="animate-spin mr-2" size={20} /> : null}
                  {isDeleting ? 'Moving to trash...' : 'Move Account to Trash'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure you want to move to trash?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action will **move your company account to the trash**. You will be logged out. Data will be retained for a period (e.g., 30-90 days) during which it can potentially be recovered by contacting support, but it will no longer be actively accessible.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount} disabled={isDeleting}>
                    {isDeleting ? 'Moving to trash...' : 'Confirm Move to Trash'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataManagement;
