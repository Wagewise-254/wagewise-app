// src/components/dashboard/payroll/GenerateP9Dialog.tsx

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from "sonner";
import { API_BASE_URL } from "@/config";
import axios from 'axios'; // Assuming axios is used for API calls
import  useAuthStore  from '@/store/authStore'; // Assuming an auth store for token

interface GenerateP9DialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const GenerateP9Dialog: React.FC<GenerateP9DialogProps> = ({ isOpen, onClose }) => {
  const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()));
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { accessToken } = useAuthStore(); // Get access token from store

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => String(currentYear - i)); // Last 5 years

  const handleDownloadP9 = async () => {
    setIsDownloading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/payroll/p9/generate/${selectedYear}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          responseType: 'blob', // Important for downloading files
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `P9_Form_${selectedYear}.zip`); // Or dynamically from response headers
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url); // Clean up the URL object
      toast.success(`P9 form for ${selectedYear} has been downloaded.`);
      onClose();
    } catch (error) {
      console.error('Error downloading P9 form:', error);
      toast.error('Failed to download P9 form. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSendP9Email = async () => {
    setIsSending(true);
    try {
      await axios.post(
        `${API_BASE_URL}/payroll/p9/send-emails`,
        { year: selectedYear },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      toast.success(`P9 forms for ${selectedYear} have been sent to employees via email.`);
      onClose();
    } catch (error) {
      console.error('Error sending P9 forms via email:', error);
      toast.error('Failed to send P9 forms via email. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Generate P9 Forms</DialogTitle>
          <DialogDescription>
            Select the year for which you want to generate P9 forms, then choose to download them or send them via email to employees.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="year" className="text-right">
              Year
            </Label>
            <Select onValueChange={setSelectedYear} defaultValue={selectedYear}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDownloading || isSending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDownloadP9}
            className="bg-[#7F5EFD] hover:bg-[#6a4fcf] text-white"
            disabled={isDownloading || isSending}
          >
            {isDownloading ? 'Downloading...' : 'Download P9'}
          </Button>
          <Button
            onClick={handleSendP9Email}
            className="bg-green-600 hover:bg-green-700 text-white"
            disabled={isSending || isDownloading}
          >
            {isSending ? 'Sending...' : 'Send P9 (Email)'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GenerateP9Dialog;