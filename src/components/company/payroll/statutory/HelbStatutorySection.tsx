// src/components/company/payroll/statutory/HelbStatutorySection.tsx

import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { HelbTable, HelbRecord } from "@/components/company/payroll/statutory/HelbTable";
import AddHelbDialog from "./AddHelbDialog";
import { API_BASE_URL } from "@/config";
import { useAuthStore } from "@/stores/authStore";
import { Loader2 } from "lucide-react";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const HelbStatutorySection = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const { session } = useAuthStore();
  
  const [helbRecords, setHelbRecords] = useState<HelbRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (!companyId || !session) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/companies/${companyId}/helb`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch HELB records.");

      const recordsData = await response.json();
      setHelbRecords(recordsData);

    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [companyId, session]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdated = () => {
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">HELB Deductions</CardTitle>
            <CardDescription>
              View and manage Higher Education Loans Board (HELB) records for your employees.
            </CardDescription>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} className="bg-[#7F5EFD] text-white hover:bg-[#6a4ad3]">
            Add HELB Record
          </Button>
        </CardHeader>
        <CardContent>
          <HelbTable data={helbRecords} onEdit={() => {}} onDelete={() => {}} />
        </CardContent>
      </Card> 

      <AddHelbDialog
        companyId={companyId!}
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onUpdated={handleUpdated}
      />
    </div>
  );
};

export default HelbStatutorySection;